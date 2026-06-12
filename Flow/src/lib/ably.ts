import * as Ably from 'ably'

const key = import.meta.env.VITE_ABLY_API_KEY
const CHANNEL = import.meta.env.VITE_ABLY_CHANNEL || 'flow-run'

// CẢNH BÁO BẢO MẬT: dùng API key Ably trực tiếp ở client nghĩa là key bị lộ trong
// bundle. Với production nên dùng Token Auth (server cấp token) thay vì key gốc.
let rest: Ably.Rest | null = null

function getRest(): Ably.Rest {
  if (!key) throw new Error('Thiếu VITE_ABLY_API_KEY trong .env')
  if (!rest) rest = new Ably.Rest({ key })
  return rest
}

/** Nội dung message gửi lên Ably khi bấm Run. */
export interface RunMessage {
  flowId: string
  name: string | null
  at: string // ISO time
}

/** Publish sự kiện "run" kèm id file flow lên kênh Ably. */
export async function publishRun(flowId: string, name: string | null): Promise<void> {
  const payload: RunMessage = { flowId, name, at: new Date().toISOString() }
  await getRest().channels.get(CHANNEL).publish('run', payload)
}
