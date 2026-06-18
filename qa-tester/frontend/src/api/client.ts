const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[${res.status}] ${text.slice(0, 200)}`)
  }
  return res.json()
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  getTestCases: (tipo?: string, subtipo?: string) => {
    const params = new URLSearchParams()
    if (tipo) params.set('tipo', tipo)
    if (subtipo) params.set('subtipo', subtipo)
    return request<{ total: number; test_cases: any[] }>(`/test-cases?${params}`)
  },

  executeFunctional: (subtipos?: string) =>
    request<any>('/execute/functional', {
      method: 'POST',
      body: subtipos ? JSON.stringify({ subtipos }) : undefined,
    }),

  executeNonFunctional: (subtipos?: string) =>
    request<any>('/execute/non-functional', {
      method: 'POST',
      body: subtipos ? JSON.stringify({ subtipos }) : undefined,
    }),

  executeBlackBox: (tecnicas?: string) =>
    request<any>('/execute/black-box', {
      method: 'POST',
      body: tecnicas ? JSON.stringify({ tecnicas }) : undefined,
    }),

  executeWhiteBox: (tecnicas?: string) =>
    request<any>('/execute/white-box', {
      method: 'POST',
      body: tecnicas ? JSON.stringify({ tecnicas }) : undefined,
    }),

  executeAll: () =>
    request<any>('/execute/all', { method: 'POST' }),

  runPytest: () =>
    request<any>('/frameworks/pytest', { method: 'POST' }),

  runPlaywright: () =>
    request<any>('/frameworks/playwright', { method: 'POST' }),

  runLocust: (users = 10, runTime = '30s') =>
    request<any>(`/frameworks/locust?users=${users}&run_time=${runTime}`, { method: 'POST' }),

  runRobot: () =>
    request<any>('/frameworks/robot', { method: 'POST' }),

  generateReport: () =>
    request<{ success: boolean; pdf_path: string; filename: string }>('/report/generate', { method: 'POST' }),

  generateReportFromResults: (results: any) =>
    request<{ success: boolean; pdf_path: string; filename: string }>('/report/generate-from-results', {
      method: 'POST',
      body: JSON.stringify({ results }),
    }),

  getSystemStats: () =>
    request<{
      cpu: { percent: number; per_core: number[]; cores: number; freq_mhz: number }
      memory: { percent: number; used_gb: number; total_gb: number; swap_percent: number }
      disk: { percent: number; used_gb: number; total_gb: number }
      network: { sent_mbps: number; recv_mbps: number }
      uptime: string
      timestamp: number
    }>('/system/stats'),

  sendEmail: (toEmail: string, pdfPath: string) =>
    request<{ success: boolean; detail: string }>('/report/send-email', {
      method: 'POST',
      body: JSON.stringify({ to_email: toEmail, pdf_path: pdfPath }),
    }),

  listReports: () =>
    request<{ reports: string[] }>('/report/list'),

  generateGherkin: (categoria?: string) => {
    const params = categoria ? `?categoria=${categoria}` : ''
    return request<any>(`/gherkin/generate${params}`, { method: 'POST' })
  },

  listGherkinFiles: () =>
    request<{ files: any[] }>('/gherkin/list'),

  getHistory: () =>
    request<{ history: any[] }>('/history'),
}
