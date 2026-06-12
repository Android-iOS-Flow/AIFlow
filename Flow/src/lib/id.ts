let counter = 0

/** Tạo id duy nhất cho node mới (vd: tap_1, tap_2...). */
export function createNodeId(type: string): string {
  counter += 1
  return `${type}_${Date.now().toString(36)}_${counter}`
}
