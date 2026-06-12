import type { NodeCategory } from '@/types/flow.types'
import type { Locale } from './types'

/** Tập chuỗi giao diện (UI chrome) cho từng ngôn ngữ. */
export interface Messages {
  appTitle: string
  toolbar: {
    save: string
    open: string
    import: string
    export: string
    clear: string
    savedAlert: string
    noSavedAlert: string
    clearConfirm: string
    readError: string
  }
  sidebar: {
    title: string
    subtitle: string
  }
  inspector: {
    title: string
    emptyHint: string
    displayName: string
    deleteNode: string
    close: string
  }
  language: {
    label: string
  }
  theme: {
    label: string
    light: string
    dark: string
  }
  edge: {
    delete: string
  }
  globals: {
    title: string
    hint: string
    add: string
    empty: string
    name: string
    value: string
  }
  field: {
    literal: string
    global: string
    var: string
    noGlobals: string
    pickGlobal: string
    varName: string
  }
  categories: Record<NodeCategory, string>
  auth: {
    signInTitle: string
    signUpTitle: string
    subtitle: string
    email: string
    password: string
    signIn: string
    signUp: string
    toSignUp: string
    toSignIn: string
    signOut: string
    processing: string
    confirmSent: string
    missingFields: string
  }
  cloud: {
    title: string
    namePlaceholder: string
    saveNew: string
    update: string
    myFlows: string
    empty: string
    refresh: string
    open: string
    makePublic: string
    makePrivate: string
    copyLink: string
    linkCopied: string
    delete: string
    deleteConfirm: string
    needName: string
    saved: string
    publicTag: string
    privateTag: string
    error: string
    createNew: string
    importFile: string
    noActive: string
    saving: string
    savedShort: string
    unsavedHint: string
    gateTitle: string
    gateHint: string
    gateOpenTitle: string
    gateManage: string
    restorePrompt: string
    restoreTitle: string
    restoreSavedAt: string
    restoreYes: string
    restoreNo: string
  }
  run: {
    run: string
    running: string
    sent: string
    error: string
  }
}

export const messages: Record<Locale, Messages> = {
  en: {
    appTitle: 'Phone Flow Builder',
    toolbar: {
      save: 'Save',
      open: 'Open (saved)',
      import: 'Import JSON',
      export: 'Export JSON',
      clear: 'Clear',
      savedAlert: 'Flow saved to the browser (localStorage).',
      noSavedAlert: 'No saved flow found.',
      clearConfirm: 'Clear the entire current flow?',
      readError: 'Could not read file: ',
    },
    sidebar: {
      title: 'Node Library',
      subtitle: 'Drag a node onto the canvas to add it',
    },
    inspector: {
      title: 'Node properties',
      emptyHint: 'Select a node on the canvas to view and edit its parameters.',
      displayName: 'Display name',
      deleteNode: 'Delete node',
      close: 'Close',
    },
    language: {
      label: 'Language',
    },
    theme: {
      label: 'Theme',
      light: 'Light mode',
      dark: 'Dark mode',
    },
    edge: {
      delete: 'Delete connection',
    },
    globals: {
      title: 'Globals',
      hint: 'Shared variables; bind any field to one',
      add: 'Add global',
      empty: 'No globals yet',
      name: 'Name',
      value: 'Value',
    },
    field: {
      literal: 'Text',
      global: 'Global',
      var: 'Var',
      noGlobals: 'No globals defined',
      pickGlobal: 'Pick a global…',
      varName: 'Variable name (filled by tool)',
    },
    categories: {
      flow: 'Start / End',
      basic: 'Basic actions',
      logic: 'Conditions & Loops',
      app: 'App control',
      event: 'Realtime events',
    },
    auth: {
      signInTitle: 'Sign in',
      signUpTitle: 'Create account',
      subtitle: 'Phone Flow Builder',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign in',
      signUp: 'Sign up',
      toSignUp: "Don't have an account? Sign up",
      toSignIn: 'Already have an account? Sign in',
      signOut: 'Sign out',
      processing: 'Processing…',
      confirmSent: 'Confirmation email sent. Please check your inbox to verify your account.',
      missingFields: 'Please enter both email and password.',
    },
    cloud: {
      title: 'Cloud flows',
      namePlaceholder: 'Flow name…',
      saveNew: 'Save as new',
      update: 'Update',
      myFlows: 'My flows',
      empty: 'No saved flows yet',
      refresh: 'Refresh',
      open: 'Open',
      makePublic: 'Make public (shareable)',
      makePrivate: 'Make private',
      copyLink: 'Copy share link',
      linkCopied: 'Link copied!',
      delete: 'Delete',
      deleteConfirm: 'Delete this flow from the cloud?',
      needName: 'Please enter a name.',
      saved: 'Saved to cloud.',
      publicTag: 'public',
      privateTag: 'private',
      error: 'Cloud error: ',
      createNew: 'Create flow',
      importFile: 'Import from file',
      noActive: 'No flow open',
      saving: 'Saving…',
      savedShort: 'Saved',
      unsavedHint: 'Unsaved — press Ctrl+S to save',
      gateTitle: 'No flow open',
      gateHint: 'Create a new flow or open one from the cloud to start adding nodes.',
      gateOpenTitle: 'Open a flow',
      gateManage: 'New flow / Manage',
      restorePrompt: 'An unsaved draft was found. Restore it, or discard and open the saved version?',
      restoreTitle: 'Unsaved draft found',
      restoreSavedAt: 'Draft saved at',
      restoreYes: 'Restore draft',
      restoreNo: 'Open saved',
    },
    run: {
      run: 'Run',
      running: 'Running…',
      sent: 'Sent to Ably ✓',
      error: 'Run error: ',
    },
  },
  vi: {
    appTitle: 'Phone Flow Builder',
    toolbar: {
      save: 'Lưu',
      open: 'Mở (đã lưu)',
      import: 'Nhập JSON',
      export: 'Xuất JSON',
      clear: 'Xoá',
      savedAlert: 'Đã lưu flow vào trình duyệt (localStorage).',
      noSavedAlert: 'Chưa có flow nào được lưu.',
      clearConfirm: 'Xoá toàn bộ flow hiện tại?',
      readError: 'Không đọc được file: ',
    },
    sidebar: {
      title: 'Thư viện Node',
      subtitle: 'Kéo node vào canvas để thêm',
    },
    inspector: {
      title: 'Thuộc tính node',
      emptyHint: 'Chọn một node trên canvas để xem và chỉnh sửa tham số.',
      displayName: 'Tên hiển thị',
      deleteNode: 'Xoá node',
      close: 'Đóng',
    },
    language: {
      label: 'Ngôn ngữ',
    },
    theme: {
      label: 'Giao diện',
      light: 'Chế độ sáng',
      dark: 'Chế độ tối',
    },
    edge: {
      delete: 'Xoá kết nối',
    },
    globals: {
      title: 'Biến Global',
      hint: 'Biến dùng chung; gán cho field bất kỳ',
      add: 'Thêm global',
      empty: 'Chưa có global',
      name: 'Tên',
      value: 'Giá trị',
    },
    field: {
      literal: 'Text',
      global: 'Global',
      var: 'Var',
      noGlobals: 'Chưa khai báo global',
      pickGlobal: 'Chọn global…',
      varName: 'Tên biến (tool truyền vào)',
    },
    categories: {
      flow: 'Bắt đầu / Kết thúc',
      basic: 'Hành động cơ bản',
      logic: 'Điều kiện & Vòng lặp',
      app: 'Điều khiển ứng dụng',
      event: 'Sự kiện realtime',
    },
    auth: {
      signInTitle: 'Đăng nhập',
      signUpTitle: 'Tạo tài khoản',
      subtitle: 'Phone Flow Builder',
      email: 'Email',
      password: 'Mật khẩu',
      signIn: 'Đăng nhập',
      signUp: 'Đăng ký',
      toSignUp: 'Chưa có tài khoản? Đăng ký',
      toSignIn: 'Đã có tài khoản? Đăng nhập',
      signOut: 'Đăng xuất',
      processing: 'Đang xử lý…',
      confirmSent: 'Đã gửi email xác nhận. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.',
      missingFields: 'Vui lòng nhập đủ email và mật khẩu.',
    },
    cloud: {
      title: 'Flow trên Cloud',
      namePlaceholder: 'Tên flow…',
      saveNew: 'Lưu mới',
      update: 'Cập nhật',
      myFlows: 'Flow của tôi',
      empty: 'Chưa có flow nào được lưu',
      refresh: 'Tải lại',
      open: 'Mở',
      makePublic: 'Công khai (chia sẻ được)',
      makePrivate: 'Để riêng tư',
      copyLink: 'Sao chép link chia sẻ',
      linkCopied: 'Đã sao chép link!',
      delete: 'Xoá',
      deleteConfirm: 'Xoá flow này khỏi cloud?',
      needName: 'Vui lòng nhập tên.',
      saved: 'Đã lưu lên cloud.',
      publicTag: 'công khai',
      privateTag: 'riêng tư',
      error: 'Lỗi cloud: ',
      createNew: 'Tạo flow',
      importFile: 'Nhập từ file',
      noActive: 'Chưa mở flow nào',
      saving: 'Đang lưu…',
      savedShort: 'Đã lưu',
      unsavedHint: 'Chưa lưu — nhấn Ctrl+S để lưu',
      gateTitle: 'Chưa mở flow nào',
      gateHint: 'Tạo flow mới hoặc mở một flow từ cloud để bắt đầu thêm node.',
      gateOpenTitle: 'Mở một flow',
      gateManage: 'Tạo mới / Quản lý',
      restorePrompt: 'Phát hiện bản nháp chưa lưu. Khôi phục bản nháp, hay bỏ qua và mở bản đã lưu?',
      restoreTitle: 'Có bản nháp chưa lưu',
      restoreSavedAt: 'Bản nháp lưu lúc',
      restoreYes: 'Khôi phục bản nháp',
      restoreNo: 'Mở bản đã lưu',
    },
    run: {
      run: 'Chạy',
      running: 'Đang chạy…',
      sent: 'Đã gửi lên Ably ✓',
      error: 'Lỗi chạy: ',
    },
  },
}
