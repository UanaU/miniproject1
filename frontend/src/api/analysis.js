import client from './client'

export function fetchAnalysis(yearMonth) {
  return client.get('/managementfee/analysis', { params: { year_month: yearMonth } })
}
