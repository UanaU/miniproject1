import { useState } from 'react'
import { fetchAnalysis } from '../api/analysis'

export default function AnalysisCard({ yearMonth }) {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [result, setResult] = useState(null)

  async function handleClick() {
    setState('loading')
    try {
      const res = await fetchAnalysis(yearMonth)
      setResult(res.data)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="card analysis-card">
      <h3>AI 원인분석</h3>
      {state === 'idle' && (
        <button onClick={handleClick}>AI 원인분석 보기</button>
      )}
      {state === 'loading' && <p>분석 중입니다...</p>}
      {state === 'error' && (
        <>
          <p className="error-text">AI 분석을 불러오지 못했습니다.</p>
          <button onClick={handleClick}>다시 시도</button>
        </>
      )}
      {state === 'done' && result && (
        <>
          {result.fallback && (
            <p className="fallback-banner">
              AI 분석을 일시적으로 사용할 수 없어 기본 안내를 표시합니다.
            </p>
          )}
          <p className="analysis-text">{result.원인분석}</p>
          <ul className="tips-list">
            {result.절약팁?.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
