const GROUPS = [
  { key: '세대별', label: '세대별 항목 (평수·가구원수에 따라 다름)', clickable: true },
  { key: '단지공통', label: '단지 공통 항목 (전 세대 동일)', clickable: false },
  { key: '동공통', label: '동 공통 항목 (같은 동끼리 동일)', clickable: false },
]

export default function FeeBreakdownTable({ thisMonth, selectedField, onSelectField }) {
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
            {Object.entries(thisMonth[group.key]).map(([name, value]) => (
              <tr
                key={name}
                className={
                  group.clickable
                    ? 'clickable-row' + (selectedField === name ? ' selected' : '')
                    : undefined
                }
                onClick={group.clickable ? () => onSelectField?.(name) : undefined}
              >
                <th>{name}</th>
                <td>{value.toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  )
}
