// 데이터 값의 최소/최대 주변으로 Y축 범위를 좁혀 변화·차이가 뚜렷하게 보이도록 계산한다.
// (막대/꺾은선 그래프 모두 0부터 시작하지 않고 값 근처만 확대해서 보여준다)
export function computeTightDomain(values, paddingRatio = 0.15) {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v))
  if (nums.length === 0) return [0, 1]

  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = max - min

  // 값이 전부 동일하거나 차이가 거의 없으면 값 크기의 10%를 여백으로 사용
  const padding = range > 0 ? range * paddingRatio : Math.max(max * 0.1, 1000)

  const lower = Math.max(0, Math.floor((min - padding) / 100) * 100)
  const upper = Math.ceil((max + padding) / 100) * 100

  return [lower, upper]
}

// Y축 범위가 좁을 때(예: 1천 단위 반올림 시 눈금이 서로 겹치는 경우) 소수점을 붙여 구분되게 표시한다.
export function formatAxisTick(value, domain) {
  const span = domain[1] - domain[0]
  if (span < 5000) {
    return `${(value / 1000).toFixed(1)}천`
  }
  return `${Math.round(value / 1000)}천`
}

// 막대그래프 전용: Y축을 정확히 step(원) 간격으로 좁혀서 계산한다.
export function computeStepDomain(values, step, paddingRatio = 0.15) {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v))
  if (nums.length === 0) return [0, step]

  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = max - min
  const padding = range > 0 ? range * paddingRatio : step * 2

  const lower = Math.max(0, Math.floor((min - padding) / step) * step)
  const upper = Math.ceil((max + padding) / step) * step

  return upper > lower ? [lower, upper] : [lower, lower + step]
}

// domain 범위 안에서 step 간격의 눈금 배열을 만든다.
export function buildStepTicks(domain, step) {
  const ticks = []
  for (let v = domain[0]; v <= domain[1] + step / 2; v += step) {
    ticks.push(Math.round(v))
  }
  return ticks
}
