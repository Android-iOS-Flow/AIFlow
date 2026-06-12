import { isGlobalRef, isVarRef, type FieldValue } from '@/types/flow.types'

/**
 * Chuỗi hiển thị 1 field value:
 *  - literal: in thẳng
 *  - global:  ⟨tên⟩
 *  - var (tool truyền vào): $tên
 */
export function displayValue(v: FieldValue | undefined): string {
  if (v === undefined || v === null) return ''
  if (isGlobalRef(v)) return `⟨${v.$global}⟩`
  if (isVarRef(v)) return `$${v.$var}`
  return String(v)
}
