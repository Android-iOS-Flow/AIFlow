# REMOTE_SPEC — Đặc tả engine thực thi Flow điều khiển điện thoại

Tài liệu này mô tả **hợp đồng dữ liệu** và **ngữ nghĩa thực thi** cho phần *remote* — chương trình
đọc file flow (xuất từ Phone Flow Builder, xem `examples/demo-flow.json`) rồi điều khiển điện
thoại theo từng node.

Mục tiêu: một dev (hoặc Claude Code) đọc tài liệu này + 1 file JSON demo là đủ để viết engine,
không cần đọc source của web app.

---

## 1. Tổng quan kiến trúc

```
┌────────────────┐   flow.json    ┌─────────────────────┐   lệnh    ┌──────────────┐
│ Phone Flow      │ ─────────────▶ │  Remote Engine       │ ───────▶ │ DeviceDriver │ ─▶ 📱
│ Builder (web)   │   (export)     │  (đọc & duyệt graph) │           │ (ADB/Appium) │
└────────────────┘                └─────────────────────┘           └──────────────┘
```

Engine gồm 3 lớp:
1. **Loader** — đọc & validate JSON thành `FlowDocument`.
2. **Executor** — duyệt graph theo cạnh, quản lý biến runtime, vòng lặp, rẽ nhánh.
3. **DeviceDriver** — lớp trừu tượng thực hiện hành động vật lý (tap, swipe, mở app…). Có thể cài
   bằng ADB, Appium, Frida… mà không đổi Executor.

---

## 2. Hợp đồng dữ liệu (FlowDocument)

```ts
interface FlowDocument {
  version: number            // hiện tại = 1
  nodes: FlowNode[]
  edges: FlowEdge[]
  globals?: GlobalVar[]      // biến dùng chung cấp flow (mục 4.1)
}

interface GlobalVar {
  name: string               // tên biến, duy nhất
  value: string | number     // giá trị khởi tạo
  description?: string
}

interface FlowNode {
  id: string                 // duy nhất
  type: string               // loại node, xem mục 5
  position: { x: number; y: number }   // chỉ phục vụ hiển thị, engine BỎ QUA
  data: {
    type: string             // trùng node.type
    label: string            // tên hiển thị do người dùng đặt
    values: Record<string, FieldValue>   // tham số, KEY theo từng type (mục 5)
  }
}

// Giá trị một field: literal | tham chiếu global | biến do tool truyền vào.
type FieldValue = string | number | { $global: string } | { $var: string }
//  - literal:  "com.android.chrome" | 540 | ...
//  - global:   { "$global": "username" }  -> lấy từ doc.globals / biến runtime cùng tên
//  - var:      { "$var": "deviceId" }     -> CHỈ là tên; TOOL REMOTE truyền giá trị vào lúc chạy
//                                            (theo dữ liệu tool đó lưu). Không có giá trị trong flow.


interface FlowEdge {
  id: string
  source: string             // id node nguồn
  target: string             // id node đích
  sourceHandle?: string      // chỉ node 'condition' dùng: "true" | "false"
  type?: string              // "deletable" (bỏ qua khi thực thi)
  animated?: boolean         // bỏ qua
}
```

> **Quy tắc chung:** Engine chỉ cần `node.data.type`, `node.data.values`, và danh sách `edges`.
> `position`, `label`, `type`, `animated` của edge **không ảnh hưởng** logic.

---

## 3. Thuật toán thực thi

### 3.1. Tìm node bắt đầu (entry)
Entry = node **không có edge nào trỏ tới** (`node.id` không xuất hiện ở bất kỳ `edge.target`).
Trong demo có 2 entry: `pusher_1` (trigger realtime) và `start_1` (chạy thủ công).

- Node `start`: chạy ngay khi bắt đầu.
- Node `pusherListen`: KHÔNG chạy ngay — engine đăng ký lắng nghe; mỗi lần nhận sự kiện sẽ khởi
  chạy một lượt thực thi mới, bắt đầu từ node kế tiếp của nó (xem 5.2).

### 3.2. Duyệt graph
Từ một node, sau khi thực hiện xong, lấy danh sách cạnh ra (`edges` có `source == node.id`):
- Node thường (0–1 cạnh ra): đi tới `target` của cạnh đó. Nếu không có cạnh ra → kết thúc nhánh.
- Node `condition`: chọn cạnh có `sourceHandle` khớp kết quả (`"true"`/`"false"`).
- Node có nhiều cạnh ra không phải condition: thực thi tuần tự/đa nhánh (khuyến nghị tuần tự theo
  thứ tự xuất hiện; engine đơn giản có thể đi nhánh đầu tiên).

Gặp node `end` → dừng nhánh hiện tại.

### 3.3. Chống lặp vô hạn
Giữ một bộ đếm bước (vd tối đa 10.000 bước) hoặc tập node đã thăm trong 1 lượt để phát hiện chu
trình ngoài ý muốn (trừ vòng lặp có chủ đích của node `loop`).

---

## 4. Bối cảnh runtime (Execution Context)

Executor mang theo một object `context` xuyên suốt một lượt chạy:

```ts
interface Context {
  globals: Record<string, unknown>   // biến dùng chung, nạp từ doc.globals (mục 4.1)
  vars: Record<string, unknown>      // biến do các node ghi ra lúc chạy
  payload?: unknown                  // dữ liệu sự kiện Pusher (nếu trigger từ pusherListen)
  log: (msg: string) => void
}
```

### 4.1. Globals & cách resolve giá trị field

`doc.globals` được nạp thành `context.globals` khi bắt đầu mỗi lượt chạy (key = `name`, value =
`value`). **Tool remote** nạp dữ liệu của nó (DB, cấu hình thiết bị, payload…) vào `context.vars`
TRƯỚC khi chạy — đây là nguồn cho các `{ $var }`. Mỗi field có thể là literal / `{ $global }` /
`{ $var }`, nên engine PHẢI cho mọi giá trị đi qua `resolveValue`:

```ts
function resolveValue(v, ctx) {
  if (v && typeof v === 'object') {
    // global: lấy từ globals khai báo (ưu tiên biến runtime nếu node đã ghi đè cùng tên)
    if ('$global' in v) {
      const name = v.$global
      return name in ctx.vars ? ctx.vars[name] : ctx.globals[name]
    }
    // var: giá trị do TOOL truyền vào, nằm trong ctx.vars (tool tự nạp theo dữ liệu của mình)
    if ('$var' in v) {
      return ctx.vars[v.$var]   // undefined nếu tool chưa cấp -> engine nên cảnh báo
    }
  }
  return v   // literal
}
```

- **`$global`**: biến khai báo sẵn trong flow (có giá trị). Vừa là input vừa có thể là output —
  node ghi `ctx.vars[name]` (vd `findElement` set `foundElement`) sẽ ghi đè ở các bước sau.
- **`$var`**: chỉ là TÊN; flow không chứa giá trị. Tool remote chịu trách nhiệm bơm dữ liệu vào
  `ctx.vars[name]` (vd từ DB người dùng, thông tin thiết bị, hay `payload`). Dùng cho dữ liệu chỉ
  biết lúc chạy / khác nhau theo từng thiết bị.
- Nhờ một điểm `resolveValue` duy nhất, engine lấy đúng dữ liệu bất kể người dùng nhập tay, trỏ
  global, hay để tool cấp.

> **Tích hợp tool:** trước mỗi `walk(...)`, tool nạp dữ liệu của mình vào `ctx.vars`. Có thể quét
> trước toàn bộ node để liệt kê các `$var` cần thiết (tập tên biến) rồi chuẩn bị giá trị tương ứng.

Biến chuẩn được các node ghi/đọc:
| Biến | Ghi bởi | Kiểu | Ý nghĩa |
|---|---|---|---|
| `foundElement` | `findElement` | boolean | Có tìm thấy element/ảnh không |
| `lastElement` | `findElement` | `{x,y,w,h}` hoặc null | Vùng element tìm được (để tap theo) |
| `appInfo` | `managerApp` action=info | object | Thông tin app lấy được |
| `lastScreenshot` | `screenshot` | string (path) | File ảnh vừa chụp |

`condition.expression` được đánh giá dựa trên `context.vars` (xem 5.8).

---

## 5. Đặc tả từng loại node

Mỗi mục: **values** (khóa & kiểu) → **hành vi remote** → **ghi context** (nếu có).

### 5.1. `start`
- values: *(không có)*
- Hành vi: điểm vào, không làm gì, đi tiếp.

### 5.2. `pusherListen` (trigger realtime, thường trực)
- values: `appKey` (string), `cluster` (string), `channel` (string), `event` (string)
- Hành vi: đăng ký Pusher (`new Pusher(appKey, { cluster })`), subscribe `channel`, bind `event`.
  Subscription **sống suốt vòng đời engine** — KHÔNG bị node `end` huỷ. Mỗi lần callback chạy:
  tạo Context mới với `payload` = dữ liệu sự kiện, rồi thực thi **một lượt task độc lập** bắt đầu
  từ node kế tiếp của `pusherListen`.
- `end` chỉ kết thúc **lượt task đó**, không ảnh hưởng listener → flow tự động "giữ Pusher để
  nhận lệnh tiếp theo".
- **Đồng thời (song song):** mỗi sự kiện spawn một lượt chạy bất đồng bộ riêng; nhiều lượt có thể
  chồng lấn. Listener chỉ dừng khi engine tắt (hoặc có node huỷ đăng ký trong tương lai).
- Không có cạnh vào. Là entry kiểu "thường trực".
- Thường nối tới một node `switch` (5.9) để rẽ task theo nội dung `payload`.

### 5.3. `managerApp` (gộp mọi thao tác quản lý app)
- values: `action` (`"open"|"close"|"kill"|"grant"|"info"`), `package` (string), `permission` (string)
- Hành vi theo `action`:
  | action | Ý nghĩa | ADB tham chiếu |
  |---|---|---|
  | `open` | Mở app | `monkey -p <pkg> -c android.intent.category.LAUNCHER 1` |
  | `close` | Đóng (force-stop) | `am force-stop <pkg>` |
  | `kill` | Kill tiến trình nền | `am kill <pkg>` |
  | `grant` | Cấp quyền | `pm grant <pkg> <permission>` |
  | `info` | Lấy thông tin app | `dumpsys package <pkg>` → ghi `context.vars.appInfo` |

### 5.4. `tap`
- values: `x` (number), `y` (number)
- Hành vi: chạm toạ độ. ADB: `input tap <x> <y>`.

### 5.5. `swipe`
- values: `x1,y1,x2,y2` (number), `duration` (number, ms)
- Hành vi: vuốt. ADB: `input swipe <x1> <y1> <x2> <y2> <duration>`.

### 5.6. `inputText`
- values: `text` (string), `selector` (string, tuỳ chọn)
- Hành vi: nếu có `selector`, focus vào ô đó trước (uiautomator/Appium); rồi gõ `text`.
  ADB cơ bản: `input text "<text>"` (lưu ý escape khoảng trắng & ký tự đặc biệt).

### 5.7. `wait`
- values: `ms` (number)
- Hành vi: ngủ `ms` mili-giây.

### 5.8. `condition` (rẽ nhánh)
- values: `expression` (string) — biểu thức boolean trên `context.vars`, vd `foundElement == true`.
- Hành vi: đánh giá biểu thức (khuyến nghị dùng trình eval an toàn, không dùng `eval()` trần).
  - `true` → đi theo cạnh có `sourceHandle == "true"`.
  - `false` → đi theo cạnh có `sourceHandle == "false"`.
- Nếu thiếu cạnh tương ứng → kết thúc nhánh.

### 5.9. `switch` (Router — định tuyến nhiều nhánh)
- values: `source` (string — đường dẫn giá trị cần rẽ, vd `payload.command`), `cases` (string —
  danh sách case phân cách dấu phẩy, vd `"login,post,like"`)
- Cổng ra: mỗi `case` là một cổng ra có `sourceHandle` = tên case; thêm một cổng `default`.
- Hành vi: lấy giá trị `value` = resolve `source` trên context (vd `context.payload.command`).
  Đi theo cạnh có `sourceHandle == String(value)`; nếu không khớp case nào → cạnh `sourceHandle ==
  "default"`. Không có cạnh phù hợp → kết thúc nhánh.
- Đặt ngay sau `pusherListen` để rẽ task theo lệnh nhận được. Mỗi nhánh là một task độc lập kết
  thúc bằng `end`, không ảnh hưởng listener.

### 5.10. `loop`
- values: `mode` (`"count"|"while"`), `count` (number), `condition` (string)
- Hành vi:
  - `mode=count`: thực thi **sub-flow phía sau** (bắt đầu từ node kế tiếp) lặp lại `count` lần.
  - `mode=while`: lặp khi `condition` còn đúng (đánh giá như 5.8 trước mỗi vòng).
- **Ngữ nghĩa sub-flow:** mỗi vòng lặp chạy chuỗi node nối tiếp từ `loop` cho tới khi gặp `end`
  hoặc node không có cạnh ra; sau đó quay lại đầu sub-flow cho vòng tiếp theo. Hết số vòng → dừng.
- ⚠️ **Giới hạn thiết kế hiện tại:** node `loop` chỉ có 1 cổng ra nên chưa tách được rõ "thân
  vòng lặp" và "bước sau khi thoát". Nếu cần vòng lặp phức tạp (thoát ra nhánh khác), nên nâng cấp
  node `loop` để có 2 cổng ra (giống `condition`: "body" và "next") — engine khi đó đọc thêm
  `sourceHandle`. Hãy ghi chú điều này khi mở rộng.

### 5.11. `findElement`
- values: `selector` (string — id/xpath hoặc đường dẫn ảnh), `timeout` (number, ms)
- Hành vi: tìm element/ảnh trên màn hình trong `timeout`.
  - Nếu `selector` là id/xpath → dùng uiautomator dump / Appium.
  - Nếu là đường dẫn ảnh → chụp màn hình rồi so khớp ảnh (OpenCV template matching).
- Ghi context: `foundElement` (boolean), `lastElement` (`{x,y,w,h}` hoặc null).

### 5.12. `screenshot`
- values: `filename` (string)
- Hành vi: chụp màn hình lưu thành `filename`. ADB: `screencap -p /sdcard/<f>` + `pull`.
- Ghi context: `lastScreenshot` = đường dẫn file.

### 5.13. `home` / `back`
- values: *(không có)*
- Hành vi: gửi phím hệ thống. ADB: `input keyevent 3` (HOME) / `input keyevent 4` (BACK).

### 5.14. `end`
- values: *(không có)*
- Hành vi: kết thúc nhánh hiện tại.

### 5.15. `adbCommand`
- values: `command` (string — lệnh ADB, vd `shell input tap 500 1000`), `args` (string — dữ liệu/
  tham số truyền thêm, tuỳ chọn)
- Hành vi: chạy lệnh ADB tuỳ ý. `command` và `args` đều có thể là literal / `$global` / `$var`
  → resolve qua `resolveValue` trước khi chạy (tool có thể bơm dữ liệu vào `args`).
  ADB: `adb <command tách theo khoảng trắng> <args...>`. Có thể ghi kết quả ra `context.vars`.

---

## 6. DeviceDriver (lớp trừu tượng nền tảng)

Executor KHÔNG gọi ADB trực tiếp; nó gọi interface này. Đổi nền tảng = viết driver mới.

```ts
interface DeviceDriver {
  tap(x: number, y: number): Promise<void>
  swipe(x1: number, y1: number, x2: number, y2: number, durationMs: number): Promise<void>
  inputText(text: string, selector?: string): Promise<void>
  keyevent(key: 'HOME' | 'BACK'): Promise<void>
  screenshot(filename: string): Promise<string>            // trả về path
  findElement(selector: string, timeoutMs: number): Promise<{ x: number; y: number; w: number; h: number } | null>
  app(action: 'open' | 'close' | 'kill' | 'grant' | 'info',
      pkg: string, permission?: string): Promise<unknown>  // info trả object
  runCommand(command: string, args?: string): Promise<string>  // adbCommand -> stdout
}
```

### Adapter ADB tham chiếu (mặc định)
```ts
import { execFile } from 'node:child_process'
const adb = (args: string[]) => new Promise<string>((res, rej) =>
  execFile('adb', ['shell', ...args], (e, out) => (e ? rej(e) : res(out))))

const AdbDriver: DeviceDriver = {
  tap: (x, y) => adb(['input', 'tap', `${x}`, `${y}`]).then(() => {}),
  swipe: (x1, y1, x2, y2, d) => adb(['input', 'swipe', `${x1}`, `${y1}`, `${x2}`, `${y2}`, `${d}`]).then(() => {}),
  inputText: (t) => adb(['input', 'text', JSON.stringify(t)]).then(() => {}),
  keyevent: (k) => adb(['input', 'keyevent', k === 'HOME' ? '3' : '4']).then(() => {}),
  screenshot: async (f) => { await adb(['screencap', '-p', `/sdcard/${f}`]); /* + adb pull */ return f },
  findElement: async (_sel, _t) => { /* uiautomator dump hoặc OpenCV */ return null },
  app: (action, pkg, perm) => {
    switch (action) {
      case 'open':  return adb(['monkey', '-p', pkg, '-c', 'android.intent.category.LAUNCHER', '1'])
      case 'close': return adb(['am', 'force-stop', pkg])
      case 'kill':  return adb(['am', 'kill', pkg])
      case 'grant': return adb(['pm', 'grant', pkg, perm!])
      case 'info':  return adb(['dumpsys', 'package', pkg])
    }
  },
  runCommand: (command, args) =>
    adb([...command.split(' '), ...(args ? args.split(' ') : [])]),
}
```

---

## 7. Pseudocode Executor

```ts
async function runFlow(doc: FlowDocument, driver: DeviceDriver) {
  const byId = new Map(doc.nodes.map(n => [n.id, n]))
  const outEdges = (id: string) => doc.edges.filter(e => e.source === id)
  const targets = new Set(doc.edges.map(e => e.target))
  const entries = doc.nodes.filter(n => !targets.has(n.id))
  const globals = Object.fromEntries((doc.globals ?? []).map(g => [g.name, g.value]))
  const mkCtx = (payload) => ({ globals, vars: {}, payload, log: console.log })

  for (const entry of entries) {
    if (entry.type === 'pusherListen') {
      subscribePusher(entry, doc, byId, outEdges, driver, mkCtx)   // daemon, không await
    } else {
      await walk(entry.id, mkCtx(), doc, byId, outEdges, driver)
    }
  }
}

// Daemon: subscription sống mãi; mỗi sự kiện spawn 1 lượt task SONG SONG (không await nhau).
function subscribePusher(node, doc, byId, outEdges, driver, mkCtx) {
  const v = node.data.values
  const pusher = new Pusher(v.appKey, { cluster: v.cluster })
  const next = outEdges(node.id)[0]?.target          // thường là node 'switch'
  pusher.subscribe(v.channel).bind(v.event, (payload) => {
    if (next) void walk(next, mkCtx(payload), doc, byId, outEdges, driver)   // KHÔNG await -> song song
  })
}

// execNode: map node.type -> driver; LẤY MỌI field qua resolveValue(field, ctx) trước khi dùng.
// vd: driver.tap(resolveValue(v.x, ctx), resolveValue(v.y, ctx))

// Lấy giá trị theo đường dẫn "payload.command" / "vars.foo" trên context.
function resolvePath(path, ctx) {
  return String(path).split('.').reduce((o, k) => (o == null ? o : o[k]), ctx)
}

async function walk(nodeId, ctx, doc, byId, outEdges, driver) {
  let current = nodeId
  let steps = 0
  while (current && steps++ < 10000) {
    const node = byId.get(current)
    if (!node) break
    if (node.type === 'end') break

    await execNode(node, ctx, driver)        // thực hiện hành động vật lý

    const outs = outEdges(node.id)
    if (node.type === 'condition') {
      const branch = evalExpr(node.data.values.expression, ctx) ? 'true' : 'false'
      current = outs.find(e => e.sourceHandle === branch)?.target
    } else if (node.type === 'switch') {
      const value = String(resolvePath(node.data.values.source, ctx))   // vd "payload.command"
      current = (outs.find(e => e.sourceHandle === value)
              ?? outs.find(e => e.sourceHandle === 'default'))?.target
    } else if (node.type === 'loop') {
      const next = outs[0]?.target
      const times = node.data.values.mode === 'count' ? Number(node.data.values.count) : Infinity
      for (let i = 0; i < times; i++) {
        if (node.data.values.mode === 'while' && !evalExpr(node.data.values.condition, ctx)) break
        if (next) await walk(next, ctx, doc, byId, outEdges, driver)
      }
      break   // sub-flow tự kết thúc ở 'end'
    } else {
      current = outs[0]?.target
    }
  }
}
```

`execNode` map `node.type` → lời gọi `driver` đúng theo mục 5.

---

## 8. Chạy thử với `examples/demo-flow.json`

Luồng mong đợi (entry `start_1`):
```
open app → grant CAMERA → wait 1500ms → loop x3 → find login_button.png → IF foundElement
   ├─ TRUE  → tap(540,1180) → input "hello@example.com" → swipe → HOME → END
   └─ FALSE → screenshot error_state.png → kill app → END
```
Entry `pusher_1`: mỗi sự kiện `command` trên channel `device-001` cũng chạy lại từ `open app`.

---

## 9. Xử lý lỗi & khuyến nghị

- Mỗi `execNode` nên có try/catch; lỗi → log kèm `node.id`, có thể retry theo cấu hình.
- `inputText`: cẩn thận escape; với chữ Unicode/khoảng trắng, ADB cơ bản hạn chế — cân nhắc
  Appium `setValue` hoặc ADBKeyboard.
- `condition.expression`: KHÔNG dùng `eval()` trần. Dùng parser an toàn (vd `expr-eval`) chỉ cho
  phép truy cập `context.vars`.
- `findElement` theo ảnh: chuẩn hoá độ phân giải/scale trước khi so khớp.
- Idempotency: nên kiểm tra trạng thái trước hành động (vd app đã mở chưa) để chạy lại an toàn.
- **Đồng thời (song song):** mỗi sự kiện Pusher spawn một lượt task chạy song song. Vì điện thoại
  là tài nguyên dùng chung, hãy đảm bảo các task song song **không đụng độ UI**:
  - Lý tưởng: mỗi task thao tác trên app/khu vực độc lập.
  - Nếu có thao tác cấp thiết bị dễ xung đột (tap/swipe toàn cục, Home/Back), cân nhắc một
    **mutex/critical-section** bao quanh đoạn đó dù tổng thể vẫn chạy song song.
  - Theo dõi số task đang chạy để tránh quá tải; có thể giới hạn mức song song tối đa.

---

## 10. Mở rộng (giữ đồng bộ với web app)

Khi thêm loại node mới ở web (`Flow/src/nodes/definitions/*.ts`):
1. Bổ sung một mục trong **mục 5** của tài liệu này (values + hành vi).
2. Thêm nhánh xử lý trong `execNode` của engine.
3. Nếu là hành động vật lý mới → thêm method vào `DeviceDriver` và mọi adapter.

> Quy ước dự án: **gộp tính năng liên quan vào 1 node có `action`** (vd `managerApp`) thay vì tạo
> nhiều node. Engine phân nhánh theo `values.action`.

---

## 11. Lấy flow từ Supabase (chia sẻ / remote đọc)

Ngoài file `.json`, flow có thể được lưu trên Supabase (bảng `public.flows`, cột `document` chứa
nguyên `FlowDocument`). Mỗi flow có cờ `is_public`:

- `is_public = true` → **bất kỳ ai có `id`** đều đọc được bằng **publishable key** (an toàn để
  nhúng ở remote). Dùng cho chia sẻ và cho tool remote.
- `is_public = false` → chỉ chủ sở hữu đọc được (cần JWT của họ).

**Đọc 1 flow công khai qua REST:**

```bash
curl "https://<PROJECT_REF>.supabase.co/rest/v1/flows?id=eq.<FLOW_ID>&select=document" \
  -H "apikey: <PUBLISHABLE_KEY>" \
  -H "Authorization: Bearer <PUBLISHABLE_KEY>"
# -> [ { "document": { "version": 1, "nodes": [...], "edges": [...], "globals": [...] } } ]
```

Lấy `response[0].document` rồi đưa vào `runFlow(document, driver)` (mục 7) như khi đọc từ file.

```ts
async function loadFlowFromSupabase(flowId, ref, publishableKey) {
  const res = await fetch(
    `https://${ref}.supabase.co/rest/v1/flows?id=eq.${flowId}&select=document`,
    { headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` } },
  )
  const rows = await res.json()
  if (!rows.length) throw new Error('Flow không tồn tại hoặc không công khai')
  return rows[0].document   // FlowDocument
}
```

- RLS đảm bảo publishable key chỉ đọc được flow `is_public = true`. **Không** dùng
  `service_role`/secret key ở client; chỉ dùng ở server nếu remote cần đọc cả flow riêng tư.
- Schema bảng + policy xem `Flow/supabase/flows.sql`.
