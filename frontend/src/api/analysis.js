import client from './client'

export function postAiAnalysis(payload) {
  return client.post('/managementfee/ai-analysis', payload)
}
