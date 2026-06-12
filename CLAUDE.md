# AIFlow — Phone Flow Builder

Web app **vẽ flow** (sơ đồ luồng) cho phần mềm **tự động điều khiển điện thoại**. Người dùng kéo-thả
node để dựng kịch bản, lưu lên cloud, chia sẻ, và bấm **Run** để một tool **Remote** thực thi trên
điện thoại. Toàn bộ app nằm trong thư mục **`Flow/`**.

## Tech stack
- Vite + React 18 + TypeScript, Tailwind CSS (darkMode: 'class')
- `@xyflow/react` (ReactFlow v12) — thư viện vẽ flow chính
- Zustand — state (nhiều store nhỏ)
- Supabase (`@supabase/supabase-js`) — Auth (email/mật khẩu) + DB lưu flow
- Ably (`ably`, Rest) — publish sự kiện "Run"
- lucide-react — icon

## Lệnh
```bash
cd Flow
npm install
cp .env.example .env      # điền key
npm run dev               # http://localhost:5173
npm run build             # tsc -b && vite build (PHẢI pass trước khi xong việc)
```

## Biến môi trường (`Flow/.env`, tiền tố VITE_ để Vite expose)
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_ABLY_API_KEY`, `VITE_ABLY_CHANNEL` (tuỳ
chọn, mặc định `flow-run`). Chỉ dùng **publishable/anon key** ở client — không bao giờ secret/service_role.

## Thiết lập DB (1 lần)
Chạy `Flow/supabase/flows.sql` trong Supabase **SQL Editor**: tạo bảng `public.flows` + RLS.

---

## Kiến trúc cốt lõi: Node registry config-driven (QUAN TRỌNG NHẤT)
Mỗi loại node = **1 file** trong `Flow/src/nodes/definitions/*.ts` export một `NodeConfig`
(label/description song ngữ `{en,vi}`, category, icon, color, `fields[]`, `hasTarget/hasSource`,
optional `component`). `GenericNode` render chung dựa trên config; node đặc biệt có `component` riêng.

**Thêm node mới = tạo 1 file definition + thêm 1 dòng vào `ALL_NODE_CONFIGS` trong
`Flow/src/nodes/registry.ts`.** Không sửa chỗ nào khác (Sidebar, Inspector, canvas tự nhận).

> **Quy ước (memory):** gộp tính năng liên quan vào **1 node có field `action` (select)** thay vì
> tạo nhiều node. Ví dụ `managerApp` gộp open/close/kill/grant/info.

## Mô hình dữ liệu (`Flow/src/types/flow.types.ts`)
```ts
FlowDocument = { version:1, nodes: FlowNode[], edges: FlowEdge[], globals?: GlobalVar[] }
FlowNode.data = { type, label, values: Record<string, FieldValue> }
FieldValue = string | number | { $global: string } | { $var: string }
//   literal              | biến khai báo trong flow | tool remote bơm lúc chạy
GlobalVar = { name, value, description? }
```
Helper: `isGlobalRef`, `isVarRef`. Edge của `condition`/`switch` phân nhánh qua `sourceHandle`
(`"true"/"false"` cho condition; tên case / `"default"` cho switch).

## Các loại node hiện có (16)
- **flow**: `start`, `end`
- **basic**: `tap`(x,y), `swipe`(x1,y1,x2,y2,duration), `inputText`(text,selector), `wait`(ms)
- **logic**: `condition`(expression→true/false), `switch`(source,cases→nhiều nhánh), `loop`(mode,count,condition), `findElement`(selector,timeout)
- **app**: `managerApp`(action,package,permission), `adbCommand`(command,args), `back`, `home`, `screenshot`(filename)
- **event**: `pusherListen`(appKey,cluster,channel,event) — trigger thường trực

---

## Hệ thống chính & file
- **i18n** (`src/i18n/`): `Locale = 'en'|'vi'` (mặc định en), `useT()` → `{locale, m, tr}`. Chuỗi UI
  trong `messages.ts`; chuỗi node nằm song ngữ trong từng config. `localeStore` (persist).
- **Theme** (`src/theme/themeStore.ts`): light/dark (persist), App đồng bộ class `dark` vào `<html>`.
- **Auth** (`src/auth/authStore.ts` + `lib/supabase.ts`): email/mật khẩu. App **chặn toàn bộ** khi
  chưa đăng nhập (`LoginPage`). `init()` lắng nghe `onAuthStateChange`.
- **Cloud-first**: phải tạo/mở 1 flow (có `cloudId`) mới thêm node được. `CanvasGate` phủ canvas khi
  chưa mở flow — tự fetch danh sách flow của user → có thì hiện danh sách, chưa có thì nút Tạo.
  - `lib/cloudFlows.ts`: CRUD bảng `flows`. `lib/cloudActions.ts`: `openCloudFlow`, `createCloudFlow(FromDoc)`,
    `saveCurrentToCloud`, `runCurrentFlow`.
  - **Quản lý file = popup** `Cloud/FlowsModal.tsx` (tạo/nhập/mở/tải/công khai/chia sẻ/xoá).
- **Lưu**: KHÔNG dùng localStorage làm nơi chính. Tự lưu **bản nháp** vào localStorage **mỗi 10s**
  (key `phone-flow-builder:draft:<cloudId>`); **Ctrl/Cmd+S** lưu lên **DB** (`saveCurrentToCloud`).
  Mở flow nếu có nháp mới hơn → `RestoreDraftDialog` hỏi khôi phục.
- **Tab tên file** (`Cloud/FileTab.tsx`, giữa Toolbar, kiểu VS Code): tên flow + chấm ● khi chưa lưu
  (`useDirty` so doc với `cloudBaseline`). Bấm tab mở popup.
- **Chia sẻ**: cờ `is_public`; link `?flow=<id>` (App tự nạp sau đăng nhập); flow công khai cho
  Remote đọc qua REST.
- **Run** (`Run/RunButton.tsx`, góc dưới phải): `runCurrentFlow` = lưu DB → `publishRun` lên Ably
  (kênh `flow-run`, event `run`, payload `{flowId, name, at}`).
- **Field source toggle** (`panel/NodeInspector.tsx`): mỗi field chọn **Text / Global / Var**.
  Globals quản lý ở `Sidebar/GlobalsPanel.tsx`.
- **Edge xoá được** (`edges/DeletableEdge.tsx`), node **resize** (NodeResizer), nền **lưới đứt mờ**.
- **ErrorBoundary** bọc App (`main.tsx`) — lỗi render hiện thông báo thay vì màn hình tối.

## State stores (zustand)
- `store/flowStore.ts`: `nodes, edges, globals, selectedNodeId, cloudId, cloudName, cloudBaseline,
  saveStatus` + actions (onNodesChange/onConnect, addNode, updateNodeData, setFlow, clear, setCloudRef…).
  `setFlow` reset cloudId=null; `clear` giữ cloudId (chỉ xoá nội dung).
- `store/uiStore.ts`: `flowsModalOpen`; `requestRestore()/answerRestore()` (Promise cho dialog khôi phục).
- `i18n/localeStore`, `theme/themeStore`, `auth/authStore`.

---

## Phần Remote (engine thực thi) — `Flow/REMOTE_SPEC.md`
Tài liệu hợp đồng dữ liệu + ngữ nghĩa từng node + thuật toán duyệt graph + interface `DeviceDriver`
(adapter ADB mặc định). Engine đọc `FlowDocument` (từ file hoặc Supabase REST theo `flowId`), duyệt
từ node entry (không có edge tới), resolve mọi field qua `resolveValue` (literal/$global/$var), rẽ
nhánh condition/switch theo `sourceHandle`. Pusher = daemon, mỗi sự kiện spawn 1 lượt **song song**.
Ví dụ: `Flow/examples/demo-flow.json`, `Flow/examples/pusher-router-flow.json`.

## Bảo mật (đã áp dụng / cần biết)
- Client chỉ dùng publishable/anon key. Bảng `flows` bật **RLS**: SELECT (chủ HOẶC `is_public`),
  INSERT/UPDATE/DELETE `TO authenticated` + ràng buộc `auth.uid() = user_id`; anon chỉ SELECT.
- ⚠️ **Ably API key đang để ở client → lộ trong bundle.** Production nên chuyển sang **Token Auth**.

## Bẫy thường gặp
- **Rules of Hooks**: KHÔNG gọi hook sau `if (...) return null` (từng gây crash → màn hình tối).
- Tailwind purge: màu node phải là **class đầy đủ** (xem `nodes/colors.ts`), không nối chuỗi động.
- Vite chỉ expose biến `VITE_*`. Path alias `@/` = `src/` (cấu hình ở `vite.config.ts` + tsconfig).
