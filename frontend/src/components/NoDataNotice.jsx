export default function NoDataNotice({ message = '비교 데이터 없음' }) {
  return <div className="no-data-notice">{message}</div>
}
