import { useState } from 'react'

const GROUPS = [
  { key: '세대별', label: '세대별 항목 (평수·가구원수에 따라 다름)', clickable: true, editable: true },
  { key: '단지공통', label: '단지 공통 항목 (전 세대 동일)', clickable: false, editable: false },
  { key: '동공통', label: '동 공통 항목 (같은 동끼리 동일)', clickable: false, editable: false },
]

export default function FeeBreakdownTable({ thisMonth, selectedField, onSelectField, onUpdateField }) {
  const [editingField, setEditingField] = useState(null)
  const [draftValue, setDraftValue] = useState('')
  const [saving, setSaving] = useState(false)

  function startEdit(name, currentValue, e) {
    e.stopPropagation()
    setEditingField(name)
    setDraftValue(String(currentValue))
  }

  function cancelEdit(e) {
    e.stopPropagation()
    setEditingField(null)
  }

  async function saveEdit(name, e) {
    e.stopPropagation()
    if (draftValue === '' || Number.isNaN(Number(draftValue))) return
    setSaving(true)
    try {
      await onUpdateField?.(name, Number(draftValue))
      setEditingField(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div
        className={'fee-total clickable-row' + (selectedField === '합계금액' ? ' selected' : '')}
        onClick={() => onSelectField?.('합계금액')}
      >
        <span>합계금액</span>
        <strong>{thisMonth.합계금액.toLocaleString()}원</strong>
      </div>
      {GROUPS.map((group) => (
        <table key={group.key} className="fee-table">
          <caption>{group.label}</caption>
          <tbody>
            {Object.entries(thisMonth[group.key]).map(([name, value]) => {
              const isEditing = editingField === name
              return (
                <tr
                  key={name}
                  className={
                    group.clickable
                      ? 'clickable-row' + (selectedField === name ? ' selected' : '')
                      : undefined
                  }
                  onClick={group.clickable && !isEditing ? () => onSelectField?.(name) : undefined}
                >
                  <th>{name}</th>
                  <td>
                    {isEditing ? (
                      <span className="inline-edit">
                        <input
                          type="number"
                          value={draftValue}
                          onChange={(e) => setDraftValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                        <button type="button" onClick={(e) => saveEdit(name, e)} disabled={saving}>
                          저장
                        </button>
                        <button type="button" className="secondary" onClick={cancelEdit}>
                          취소
                        </button>
                      </span>
                    ) : (
                      <span className="value-with-edit">
                        {value.toLocaleString()}원
                        {group.editable && (
                          <button
                            type="button"
                            className="edit-icon-btn"
                            onClick={(e) => startEdit(name, value, e)}
                          >
                            수정
                          </button>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ))}
    </div>
  )
}
