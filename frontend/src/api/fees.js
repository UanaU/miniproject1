import client from './client'

export function fetchSummary(yearMonth) {
  return client.get('/managementfee/summary', { params: { year_month: yearMonth } })
}

export function fetchHistory() {
  return client.get('/managementfee/history')
}

export function registerFee(payload) {
  return client.post('/managementfee/register', payload)
}
