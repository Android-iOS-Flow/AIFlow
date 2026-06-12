import { Trash2, X } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { getNodeConfig } from '@/nodes/registry'
import { useT } from '@/i18n/useT'
import { isGlobalRef, isVarRef } from '@/types/flow.types'
import type { FieldValue, GlobalRef, GlobalVar, NodeFieldDef, VarRef } from '@/types/flow.types'

/** Cột phải: sửa tham số của node đang chọn. Tự render input theo field config. */
export function NodeInspector() {
  const { m, tr } = useT()
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId)
  const node = useFlowStore((s) => s.nodes.find((n) => n.id === s.selectedNodeId))
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const updateNodeLabel = useFlowStore((s) => s.updateNodeLabel)
  const removeNode = useFlowStore((s) => s.removeNode)
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode)

  if (!selectedNodeId || !node) {
    return (
      <aside className="w-72 border-l border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-400 dark:text-slate-500">{m.inspector.emptyHint}</p>
      </aside>
    )
  }

  const config = getNodeConfig(node.data.type)
  if (!config) return null

  return (
    <aside className="flex w-72 flex-col border-l border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{m.inspector.title}</h2>
        <button
          onClick={() => setSelectedNode(null)}
          className="rounded p-1 text-slate-400 hover:bg-slate-200 dark:text-slate-500 dark:hover:bg-slate-800"
          title={m.inspector.close}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {tr(config.label)}
          </span>
          {config.description && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{tr(config.description)}</p>
          )}
        </div>

        {/* Nhãn node (tự đặt tên) */}
        <Field label={m.inspector.displayName}>
          <input
            type="text"
            value={node.data.label}
            onChange={(e) => updateNodeLabel(node.id, e.target.value)}
            className="input"
          />
        </Field>

        {/* Các tham số theo config — mỗi field chọn Text (literal) hoặc Global */}
        {config.fields.map((field) => (
          <FieldRow
            key={field.key}
            field={field}
            value={node.data.values[field.key]}
            onChange={(value) => updateNodeData(node.id, { [field.key]: value })}
          />
        ))}
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          onClick={() => removeNode(node.id)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
        >
          <Trash2 size={15} />
          {m.inspector.deleteNode}
        </button>
      </div>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
      {children}
    </label>
  )
}

/**
 * Một field trong Inspector: có công tắc Text (literal) / Global.
 * - Text: render input theo kiểu field.
 * - Global: chọn 1 biến global -> lưu dạng `{ $global: 'tên' }`.
 */
function FieldRow({
  field,
  value,
  onChange,
}: {
  field: NodeFieldDef
  value: FieldValue | undefined
  onChange: (value: FieldValue) => void
}) {
  const { m, tr } = useT()
  const globals = useFlowStore((s) => s.globals)

  const mode: 'literal' | 'global' | 'var' = isGlobalRef(value)
    ? 'global'
    : isVarRef(value)
      ? 'var'
      : 'literal'

  // Tên đang dùng (nếu đang ở dạng tham chiếu) để giữ lại khi đổi mode.
  const currentName = isGlobalRef(value)
    ? value.$global
    : isVarRef(value)
      ? value.$var
      : ''

  const setMode = (next: 'literal' | 'global' | 'var') => {
    if (next === 'global') onChange({ $global: currentName || globals[0]?.name || '' })
    else if (next === 'var') onChange({ $var: currentName })
    else onChange(field.default)
  }

  const toggleBtn = (next: 'literal' | 'global' | 'var', label: string) => (
    <button
      type="button"
      onClick={() => setMode(next)}
      className={`px-1.5 py-0.5 transition ${
        mode === next
          ? 'bg-sky-600 text-white'
          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  )

  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{tr(field.label)}</span>
        <span className="flex overflow-hidden rounded border border-slate-200 text-[10px] font-semibold dark:border-slate-700">
          {toggleBtn('literal', m.field.literal)}
          {toggleBtn('global', m.field.global)}
          {toggleBtn('var', m.field.var)}
        </span>
      </span>

      {mode === 'global' ? (
        <GlobalSelect
          value={(value as GlobalRef).$global}
          globals={globals}
          onChange={(name) => onChange({ $global: name })}
        />
      ) : mode === 'var' ? (
        <input
          type="text"
          value={(value as VarRef).$var}
          placeholder={m.field.varName}
          onChange={(e) => onChange({ $var: e.target.value })}
          className="input font-mono"
        />
      ) : (
        <FieldInput field={field} value={value as string | number} onChange={onChange} />
      )}
    </label>
  )
}

/** Dropdown chọn 1 biến global. */
function GlobalSelect({
  value,
  globals,
  onChange,
}: {
  value: string
  globals: GlobalVar[]
  onChange: (name: string) => void
}) {
  const { m } = useT()
  if (globals.length === 0) {
    return <div className="input text-slate-400 dark:text-slate-500">{m.field.noGlobals}</div>
  }
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>
        {m.field.pickGlobal}
      </option>
      {globals.map((g) => (
        <option key={g.name} value={g.name}>
          {g.name}
        </option>
      ))}
    </select>
  )
}

interface FieldInputProps {
  field: NodeFieldDef
  value: string | number
  onChange: (value: FieldValue) => void
}

/** Render input phù hợp với kiểu field (chế độ literal). */
function FieldInput({ field, value, onChange }: FieldInputProps) {
  const { tr } = useT()
  const placeholder = field.placeholder ? tr(field.placeholder) : undefined

  if (field.type === 'textarea') {
    return (
      <textarea
        value={String(value ?? '')}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="input resize-none"
      />
    )
  }

  if (field.type === 'select') {
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      >
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {tr(opt.label)}
          </option>
        ))}
      </select>
    )
  }

  return (
    <input
      type={field.type === 'number' ? 'number' : 'text'}
      value={String(value ?? '')}
      placeholder={placeholder}
      onChange={(e) =>
        onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)
      }
      className="input"
    />
  )
}
