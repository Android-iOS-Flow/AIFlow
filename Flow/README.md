# Phone Flow Builder

Web app vẽ **flow (sơ đồ luồng)** cho phần mềm tự động điều khiển điện thoại, xây dựng bằng
[ReactFlow](https://reactflow.dev) (`@xyflow/react`). Thiết kế **tách module** để dễ mở rộng.

## Tech stack

- Vite + React 18 + TypeScript
- `@xyflow/react` (ReactFlow v12) — thư viện vẽ flow chính
- Tailwind CSS — giao diện
- Zustand — quản lý state tập trung
- lucide-react — icon

## Cài đặt & chạy

```bash
cd Flow
npm install
cp .env.example .env   # rồi điền VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev            # mở http://localhost:5173
```

## Đăng nhập (Supabase Auth)

App được **chặn bằng đăng nhập**: chưa đăng nhập sẽ thấy trang Login (email + mật khẩu), đăng nhập
xong mới vào được trình vẽ flow. Đăng xuất bằng nút ở góc phải thanh công cụ.

**Cấu hình cần có ở Supabase Dashboard** (Authentication):
- Bật **Email** provider (mặc định đã bật).
- Mặc định Supabase **yêu cầu xác nhận email**: tài khoản mới phải bấm link trong email trước khi
  đăng nhập được. Có thể tắt ở *Authentication → Providers → Email → Confirm email* khi dev.
- Thêm `http://localhost:5173` (và URL production) vào **Site URL / Redirect URLs**.

Biến môi trường (file `.env`, tiền tố `VITE_` để Vite expose ra client):

```
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

> Chỉ dùng **publishable key** ở client. Tuyệt đối không đặt `service_role`/secret key trong app.

## Quản lý flow (Cloud-first)

Flow được lưu trên **Supabase** (không dùng localStorage làm nơi lưu chính). Quy trình:

- **Phải tạo/mở một flow trước khi thêm node** — chưa mở flow thì canvas bị khoá (hiện màn hình
  yêu cầu tạo/mở flow).
- **Tab tên file ở giữa thanh công cụ** (giống VS Code) hiển thị tên flow đang sửa + chấm **●**
  màu vàng khi có thay đổi chưa lưu. Bấm vào tab để mở **popup quản lý file**.
- **Popup quản lý file**: tạo flow mới, nhập từ file `.json` (thành flow mới), và với mỗi flow:
  **Mở · Tải về · Công khai 🌐/Riêng tư 🔒 · Sao chép link · Xoá**.
- **Tự lưu nháp** vào `localStorage` **mỗi 10 giây** (chống mất dữ liệu). Khi mở lại flow, nếu có
  bản nháp mới hơn sẽ hỏi khôi phục.
- **`Ctrl/Cmd + S`** lưu chính thức lên **database**.
- **Chia sẻ**: bật **Công khai** rồi sao chép link `?flow=<id>`; mở link (sau đăng nhập) tự nạp
  flow. Flow công khai cũng được **tool Remote đọc** qua REST (xem `REMOTE_SPEC.md` mục 11).

**Thiết lập 1 lần:** mở Supabase Dashboard → **SQL Editor** → dán toàn bộ `supabase/flows.sql` →
**Run**. File này tạo bảng `flows` + RLS (mỗi user chỉ thấy flow của mình; flow công khai ai cũng
đọc được).

## Nút Run (gửi lên Ably)

Nút **Run** (góc dưới phải khu vẽ) khi bấm sẽ:
1. **Lưu flow hiện tại lên database** (như Ctrl+S).
2. **Publish** một message lên **Ably** — kênh `VITE_ABLY_CHANNEL` (mặc định `flow-run`), event
   `run`, payload `{ flowId, name, at }`. Tool Remote lắng nghe kênh này, nhận `flowId` rồi đọc
   document từ Supabase (REMOTE_SPEC mục 11) để thực thi.

Cấu hình trong `.env`:
```
VITE_ABLY_API_KEY=appId.keyId:secret
VITE_ABLY_CHANNEL=flow-run   # tuỳ chọn
```

> ⚠️ **Bảo mật:** đặt API key Ably ở client nghĩa là key bị lộ trong bundle. Production nên dùng
> **Token Auth** (server cấp token ngắn hạn) thay vì key gốc.

Build production:

```bash
npm run build
npm run preview
```

## Sử dụng

- **Kéo** một node từ Thư viện (cột trái) vào canvas để thêm.
- **Nối** các node bằng cách kéo từ cổng dưới của node này sang cổng trên của node kia.
- **Xoá kết nối**: bấm nút **✕** ở giữa đường nối giữa 2 node.
- **Chọn** một node để mở bảng Thuộc tính (cột phải) và chỉnh tham số.
- **Nguồn dữ liệu field**: trong Thuộc tính node, mỗi field có công tắc **Text / Global / Var**:
  - **Text** — nhập giá trị trực tiếp (literal).
  - **Global** — trỏ tới biến khai báo ở khung *Globals* (đầu cột trái), có giá trị sẵn trong flow.
  - **Var** — chỉ khai báo *tên biến*; giá trị do **tool remote truyền vào lúc chạy** (theo dữ liệu
    tool đó lưu), không nằm trong flow.
- Node **Điều kiện (If)** có 2 nhánh ra: `TRUE` (xanh) và `FALSE` (đỏ).
- Thanh công cụ: **Xuất JSON** (tải flow hiện tại) và **Xoá** (làm trống flow đang mở). Lưu file
  do **popup quản lý** + **Ctrl+S** đảm nhiệm (xem mục *Quản lý flow*).
- **Giao diện Sáng/Tối**: bấm nút mặt trời/mặt trăng trên thanh công cụ (mặc định Sáng, ghi nhớ
  qua `localStorage`). Nền canvas dạng **ô kẻ lưới** cho dễ căn chỉnh.

## Cấu trúc thư mục (tách module)

```
src/
├── types/flow.types.ts      # Kiểu dữ liệu dùng chung
├── i18n/                    # === Đa ngôn ngữ ===
│   ├── types.ts             # Locale, LocalizedText
│   ├── localeStore.ts       # Ngôn ngữ đang chọn (zustand + localStorage)
│   ├── messages.ts          # Chuỗi giao diện (en / vi)
│   └── useT.ts              # Hook lấy chuỗi theo ngôn ngữ
├── theme/themeStore.ts      # Chế độ sáng/tối (zustand + localStorage)
├── nodes/                   # === Phần module hoá node ===
│   ├── registry.ts          # Đăng ký tất cả node
│   ├── GenericNode.tsx      # Render chung dựa trên config
│   ├── colors.ts            # Bảng màu node
│   ├── components/          # Node có giao diện đặc biệt (Start/End/Condition)
│   └── definitions/         # Mỗi loại node = 1 file config (text song ngữ)
├── components/              # Sidebar, Toolbar, FlowCanvas, NodeInspector,
│   │                        #   LanguageSwitcher, ThemeToggle
│   └── edges/DeletableEdge  # Edge có nút xoá kết nối
├── store/flowStore.ts       # State (zustand)
└── lib/                     # id, import/export JSON
```

## Đa ngôn ngữ (i18n)

- Mặc định **tiếng Anh (en)**, ngôn ngữ phụ **tiếng Việt (vi)**. Đổi bằng nút `EN / VI` trên
  thanh công cụ; lựa chọn được ghi nhớ qua `localStorage`.
- **Chuỗi giao diện** (toolbar, sidebar, inspector, tên nhóm) nằm trong `src/i18n/messages.ts`.
- **Text của node** (label, mô tả, nhãn tham số) nằm song ngữ ngay trong file config của node,
  ví dụ: `label: { en: 'Tap', vi: 'Chạm (Tap)' }` — giữ nguyên tắc "1 node = 1 file".

Thêm ngôn ngữ mới: thêm mã vào `Locale` trong `src/i18n/types.ts`, bổ sung bản dịch trong
`messages.ts` và trong các field `{ en, vi, ... }` của node.

## Thêm một loại node mới (rất nhanh)

1. Tạo file `src/nodes/definitions/myNode.ts`, export một object `NodeConfig`:

   ```ts
   import { Zap } from 'lucide-react'
   import type { NodeConfig } from '@/types/flow.types'

   export const myNodeConfig: NodeConfig = {
     type: 'myNode',
     label: { en: 'My Node', vi: 'Node của tôi' },
     category: 'basic',
     icon: Zap,
     color: 'sky',
     fields: [
       { key: 'value', label: { en: 'Value', vi: 'Giá trị' }, type: 'text', default: '' },
     ],
   }
   ```

2. Import và thêm vào mảng `ALL_NODE_CONFIGS` trong `src/nodes/registry.ts`.

Xong! Node tự xuất hiện trong Sidebar, tự render, và tự có form chỉnh tham số.

## Các loại node có sẵn

| Nhóm | Node |
| --- | --- |
| Bắt đầu / Kết thúc | Bắt đầu, Kết thúc |
| Hành động cơ bản | Chạm (Tap), Vuốt (Swipe), Nhập chữ, Chờ (Wait) |
| Điều kiện & Vòng lặp | Điều kiện (If), Phân nhánh (Switch), Lặp (Loop), Tìm phần tử |
| Điều khiển ứng dụng | Manager App (Open / Close / Kill / Cấp quyền / Lấy thông tin), Lệnh ADB, Back, Home, Chụp màn hình |
| Sự kiện realtime | Lắng nghe Pusher |

## Định dạng export

File JSON xuất ra có dạng:

```json
{
  "version": 1,
  "nodes": [ ... ],
  "edges": [ ... ],
  "globals": [ { "name": "username", "value": "hello@example.com" } ]
}
```

Mỗi giá trị field trong `node.data.values` có 3 dạng:
- **literal**: `"abc"` / `540`
- **global**: `{ "$global": "username" }` — biến khai báo sẵn trong flow
- **var**: `{ "$var": "deviceId" }` — chỉ là tên, tool remote bơm giá trị vào lúc chạy

Engine remote chỉ cần một hàm `resolveValue` để lấy đúng dữ liệu — xem `REMOTE_SPEC.md` mục 4.1.

Có thể dùng làm input cho engine thực thi flow (chạy lệnh điều khiển điện thoại) ở bước sau.

### Phần remote (engine thực thi)

- **`examples/demo-flow.json`** — file flow demo đầy đủ (đúng định dạng export) để tham chiếu.
- **`examples/pusher-router-flow.json`** — mẫu Pusher (thường trực) → Switch định tuyến nhiều
  task theo `payload.command`; mỗi task tự kết thúc mà listener vẫn sống.
- **`REMOTE_SPEC.md`** — đặc tả hợp đồng dữ liệu + ngữ nghĩa từng node + thuật toán thực thi +
  interface `DeviceDriver` (adapter ADB mặc định) để viết engine remote.
