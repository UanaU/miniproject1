import { useState } from 'react'
import { postAiAnalysis } from '../api/analysis'
import NoDataNotice from './NoDataNotice'

const COMPARISON_KEYS = ['전월', '같은평수평균', '같은평수_가구원수평균']

function hasComparisonData(summary) {
  return COMPARISON_KEYS.some((key) => summary[key] && !summary[key].데이터없음)
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
      <h3>AI 원인분석</h3>

      {!canAnalyze && (
        <NoDataNotice message="비교 데이터가 없어 분석할 수 없습니다." />
      )}

      {canAnalyze && state === 'idle' && (
        <button onClick={handleClick}>AI 원인분석 보기</button>
      )}
      {canAnalyze && state === 'loading' && <p>분석 중입니다...</p>}
      {canAnalyze && state === 'error' && (
        <>
          <p className="error-text">AI 분석을 불러오지 못했습니다.</p>
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
        <>
          <p className="analysis-summary">{result.분석결과.요약}</p>

          {result.분석결과.항목별원인?.length > 0 && (
            <ul className="analysis-reasons">
              {result.분석결과.항목별원인.map((reason, i) => (
                <li key={i}>
                  <strong>{reason.항목}</strong> ({reason.비교기준} 대비{' '}
                  {reason.증감액 > 0 ? '+' : ''}
                  {reason.증감액?.toLocaleString()}원, {reason.증감률}%) — {reason.설명}
                </li>
              ))}
            </ul>
          )}

          <ul className="tips-list">
            {result.분석결과.절약팁?.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
