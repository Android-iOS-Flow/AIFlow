# AIFlow Remote — Engine thực thi Flow điều khiển điện thoại

Phần **Remote** của AIFlow: đọc `FlowDocument` (do web Phone Flow Builder xuất ra / lưu trên
Supabase) rồi **điều khiển điện thoại** theo từng node. Viết bằng **Python**, theo **MVC**, chạy
được trên **Windows** và **Termux (Android)**.

Hợp đồng dữ liệu & ngữ nghĩa từng node: xem `../Flow/REMOTE_SPEC.md`.

---

## Kiến trúc (MVC)

```
Remote/
├── run.py                  # entry: web UI hoặc CLI một-lần
├── app/
│   ├── config.py           # nạp .env -> Settings(config.json)
│   ├── models/             # MODEL — dữ liệu + nghiệp vụ thuần
│   │   ├── flow.py         #   FlowDocument/Node/Edge: parse, validate, truy vấn graph
│   │   ├── context.py      #   Context + resolve_value/resolve_path (spec mục 4)
│   │   ├── settings.py     #   Settings: đọc/ghi config.json
│   │   └── flow_repository.py  # tải flow từ file hoặc Supabase REST (spec mục 11)
│   ├── engine/             # ENGINE — executor + driver (nghiệp vụ)
│   │   ├── executor.py     #   duyệt graph, rẽ nhánh, loop, song song (spec mục 3 & 7)
│   │   ├── expressions.py  #   eval biểu thức an toàn (không eval() trần)
│   │   └── drivers/        #   DeviceDriver: base (ABC) · adb · dummy
│   ├── messaging/          # TRIGGER — Ably "Run" (SSE) + node pusherListen
│   ├── controllers/        # CONTROLLER — RunnerService (điều phối) + web.py (Flask)
│   ├── views/              # VIEW — templates + static (dashboard, settings)
│   └── utils/              # logging (ring-buffer) + platform (dò adb, Windows/Termux)
└── tests/test_executor.py  # test engine bằng DummyDriver (không cần adb)
```

**Đổi/ thêm gì ở đâu:**
- Thêm **loại node mới** → thêm nhánh trong `app/engine/executor.py::exec_node` (và method mới
  trong `DeviceDriver` nếu là hành động vật lý mới). Giữ đồng bộ `REMOTE_SPEC.md` mục 5.
- Thêm **nền tảng điều khiển khác** (Appium, scrcpy, Frida…) → viết driver mới trong
  `app/engine/drivers/`, đăng ký trong `drivers/__init__.py::make_driver`. Executor không đổi.
- Thêm **cài đặt** → thêm field vào `app/models/settings.py` + input trong `views/templates/settings.html`.

---

## Cài đặt

### Windows
```bash
cd Remote
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-optional.txt   # tuỳ chọn: opencv (ảnh), pysher, ably
copy .env.example .env                       # rồi điền key
python run.py
```

### Termux (Android)
```bash
pkg install python android-tools            # android-tools = adb
cd Remote
pip install -r requirements.txt
# opencv trên Termux: pkg install python-numpy opencv-python  (KHÔNG pip)
cp .env.example .env                          # rồi điền key
python run.py
```
> Termux điều khiển máy khác qua **adb wireless** (`adb connect <ip>:5555`) hoặc cáp OTG.
> Nếu chỉ chạy logic không cần thiết bị thật, đặt `DRIVER=dummy`.

Mở web UI: **http://127.0.0.1:8765** → tab **Cài đặt** điền Supabase/Ably/driver → **Dashboard**
bật trigger hoặc chạy thủ công theo `flowId`.

---

## Cách dùng

**Web UI (mặc định):**
```bash
python run.py
```
- **Dashboard**: trạng thái thiết bị, bật/tắt trigger "Run", chạy flow theo `flowId`, xem log realtime.
- **Cài đặt**: tất cả cấu hình lưu vào `config.json` (web chỉnh được, không cần sửa code).

**CLI một-lần (tiện cho cron / test):**
```bash
python run.py --file ../Flow/examples/demo-flow.json   # chạy flow từ file
python run.py --run <FLOW_ID>                          # chạy flow công khai từ Supabase
python run.py --file demo.json --driver dummy          # chỉ log, không điều khiển thật
```

**Test:**
```bash
python tests/test_executor.py        # hoặc: python -m pytest
```

---

## Hai nguồn kích hoạt

| Nguồn | Cơ chế | Vai trò |
|---|---|---|
| **Ably** kênh `flow-run` | web app bấm **Run** → publish `run {flowId}` | Remote nghe → tải flow theo id → chạy |
| **Pusher** (node `pusherListen`) | trong flow, lắng nghe realtime | mỗi sự kiện spawn 1 task song song |

Ably dùng **SSE qua `requests`** (không cần SDK nặng). Pusher dùng `pysher` (tuỳ chọn).

## Lưu ý cross-platform & bảo mật
- Core chỉ cần `Flask` + `requests` — cài được trên cả Windows & Termux. opencv/pysher/ably là
  **tuỳ chọn**, thiếu thì engine degrade nhẹ + cảnh báo, không sập.
- Chỉ dùng **publishable/anon key** của Supabase ở Remote (RLS chỉ cho đọc flow `is_public=true`).
- `.env` và `config.json` đã nằm trong `.gitignore` — không commit key.
- ⚠️ Ably API key để ở client là điểm yếu cố hữu của thiết kế hiện tại (xem `REMOTE_SPEC`); production
  nên chuyển Token Auth.
```
