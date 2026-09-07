import client from './client'

export function fetchSummary(yearMonth) {
  return client.get('/managementfee/summary', { params: { year_month: yearMonth } })
}
