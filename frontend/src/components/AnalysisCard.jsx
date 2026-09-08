import { useState } from 'react'
import { postAiAnalysis } from '../api/analysis'
import NoDataNotice from './NoDataNotice'

const COMPARISON_KEYS = ['전월', '작년동월', '같은평수평균', '같은평수_가구원수평균']

function hasComparisonData(summary) {
  return COMPARISON_KEYS.some((key) => summary[key] && !summary[key].데이터없음)
}

function formatCreatedAt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} 발급`
}

export default function AnalysisCard({ summary }) {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [result, setResult] = useState(null)

  const canAnalyze = hasComparisonData(summary)

  async function handleClick() {
    setState('loading')
    try {
      const payload = {
        이번달: summary.이번달,
        전월: summary.전월,
        작년동월: summary.작년동월,
        같은평수평균: summary.같은평수평균,
        같은평수_가구원수평균: summary.같은평수_가구원수평균,
      }
      const res = await postAiAnalysis(payload)
      setResult(res.data)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="card analysis-card">
      <div className="diagnosis-head">
        <h3>AI 관리비 진단서</h3>
        {state === 'done' && result && !result.폴백여부 && (
          <span className="diagnosis-issued">{formatCreatedAt(result.생성시각)}</span>
        )}
      </div>

      {!canAnalyze && (
        <NoDataNotice message="비교 데이터가 없어 진단할 수 없습니다." />
      )}

      {canAnalyze && state === 'idle' && (
        <>
          <p className="diagnosis-intro">
            당월·전월·전년 동월·이웃 평균 데이터를 종합해 관리비 증감 원인과 절약팁을 진단합니다.
          </p>
          <button onClick={handleClick}>AI 진단서 받기</button>
        </>
      )}
      {canAnalyze && state === 'loading' && <p>진단서를 작성하고 있습니다...</p>}
      {canAnalyze && state === 'error' && (
        <>
          <p className="error-text">AI 진단을 불러오지 못했습니다.</p>
          <button onClick={handleClick}>다시 시도</button>
        </>
      )}

      {state === 'done' && result && result.폴백여부 && (
        <>
          <p className="fallback-banner">{result.폴백메시지}</p>
          <button onClick={handleClick}>다시 시도</button>
        </>
      )}

      {state === 'done' && result && !result.폴백여부 && (
        <div className="diagnosis-body">
          <section className="diagnosis-section">
            <h4>종합 소견</h4>
            <p className="diagnosis-summary">{result.분석결과.요약}</p>
          </section>

          <section className="diagnosis-section">
            <h4>항목별 원인</h4>
            {result.분석결과.항목별원인?.length > 0 ? (
              <ul className="analysis-reasons">
                {result.분석결과.항목별원인.map((reason, i) => (
                  <li key={i}>
                    <span className="reason-tag">
                      {reason.항목} · {reason.비교기준}
                    </span>
                    <span className="reason-delta">
                      {reason.증감액 > 0 ? '+' : ''}
                      {reason.증감액?.toLocaleString()}원 ({reason.증감률 > 0 ? '+' : ''}
                      {reason.증감률}%)
                    </span>
                    <span className="reason-desc">{reason.설명}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="diagnosis-muted">증감률 5% 이상의 특별한 변동 요인은 발견되지 않았습니다.</p>
            )}
          </section>

          <section className="diagnosis-section">
            <h4>절약 처방</h4>
            <ul className="tips-list">
              {result.분석결과.절약팁?.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </section>

          <button className="secondary" onClick={handleClick}>다시 진단</button>
        </div>
      )}
    </div>
  )
}
