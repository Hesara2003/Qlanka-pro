import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./axiosInstance', () => ({
  default: {
    get: vi.fn(),
  },
}))

import axiosInstance from './axiosInstance'
import { downloadDailyCenterSummaryCsv } from './reportsApi'

const mockedAxios = axiosInstance as unknown as {
  get: ReturnType<typeof vi.fn>
}

function axiosResponse(data: unknown, status = 400): AxiosResponse {
  return {
    data,
    status,
    statusText: 'Error',
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig,
  }
}

describe('reportsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('downloads CSV using filename from content-disposition', async () => {
    const click = vi.fn()
    const anchor = {
      href: '',
      setAttribute: vi.fn(),
      click,
      parentNode: { removeChild: vi.fn() },
    } as unknown as HTMLAnchorElement

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor)
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    const createObjectURLSpy = vi.fn(() => 'blob:test')
    const revokeObjectURLSpy = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURLSpy, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURLSpy, configurable: true })

    try {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: 'csv-data',
        headers: { 'content-disposition': 'attachment; filename="daily.csv"' },
      })

      await expect(downloadDailyCenterSummaryCsv(1, '2026-03-01', '2026-03-30')).resolves.toBeUndefined()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/reports/centers/1/summary', {
        params: { format: 'csv', from: '2026-03-01', to: '2026-03-30' },
        responseType: 'blob',
      })
      expect(anchor.setAttribute).toHaveBeenCalledWith('download', 'daily.csv')
      expect(click).toHaveBeenCalled()
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test')
    } finally {
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      Object.defineProperty(URL, 'createObjectURL', { value: originalCreateObjectURL, configurable: true })
      Object.defineProperty(URL, 'revokeObjectURL', { value: originalRevokeObjectURL, configurable: true })
    }
  })

  it('throws explicit no-data error for 204 response', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 204, headers: {}, data: '' })

    await expect(downloadDailyCenterSummaryCsv(1, '2026-03-01', '2026-03-30')).rejects.toThrow(
      'No data available for the selected dates.',
    )
  })

  it('falls back to /reports route when /api/reports returns 404', async () => {
    mockedAxios.get
      .mockRejectedValueOnce(
        new AxiosError('not found', undefined, undefined, undefined, axiosResponse({ message: 'Not found' }, 404)),
      )
      .mockResolvedValueOnce({
        status: 200,
        data: 'csv-data',
        headers: { 'content-disposition': 'attachment; filename="daily.csv"' },
      })

    const click = vi.fn()
    const anchor = {
      href: '',
      setAttribute: vi.fn(),
      click,
      parentNode: { removeChild: vi.fn() },
    } as unknown as HTMLAnchorElement

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor)
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:test'), configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })

    try {
      await expect(downloadDailyCenterSummaryCsv(1, '2026-03-01', '2026-03-30')).resolves.toBeUndefined()

      expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/api/reports/centers/1/summary', {
        params: { format: 'csv', from: '2026-03-01', to: '2026-03-30' },
        responseType: 'blob',
      })
      expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/reports/centers/1/summary', {
        params: { format: 'csv', from: '2026-03-01', to: '2026-03-30' },
        responseType: 'blob',
      })
      expect(click).toHaveBeenCalled()
    } finally {
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      Object.defineProperty(URL, 'createObjectURL', { value: originalCreateObjectURL, configurable: true })
      Object.defineProperty(URL, 'revokeObjectURL', { value: originalRevokeObjectURL, configurable: true })
    }
  })

  it('maps blob errors to generic report failure message', async () => {
    mockedAxios.get.mockRejectedValueOnce(
      new AxiosError('bad request', undefined, undefined, undefined, axiosResponse(new Blob(['x']), 400)),
    )

    await expect(downloadDailyCenterSummaryCsv(1, '2026-03-01', '2026-03-30')).rejects.toThrow(
      'Failed to run report. Check parameters.',
    )
  })

  it('uses default filename when content-disposition is missing', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: 'csv-data', headers: {} })

    const click = vi.fn()
    const anchor = {
      href: '',
      setAttribute: vi.fn(),
      click,
      parentNode: { removeChild: vi.fn() },
    } as unknown as HTMLAnchorElement

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor)
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:test'), configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })

    try {
      await expect(downloadDailyCenterSummaryCsv(1, '2026-03-01', '2026-03-30')).resolves.toBeUndefined()
      expect(anchor.setAttribute).toHaveBeenCalledWith('download', 'QueueLanka_DailySummary_2026-03-01_2026-03-30.csv')
      expect(click).toHaveBeenCalled()
    } finally {
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      Object.defineProperty(URL, 'createObjectURL', { value: originalCreateObjectURL, configurable: true })
      Object.defineProperty(URL, 'revokeObjectURL', { value: originalRevokeObjectURL, configurable: true })
    }
  })

  it('maps non-axios failures to service connectivity message', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('boom'))

    await expect(downloadDailyCenterSummaryCsv(1, '2026-03-01', '2026-03-30')).rejects.toThrow(
      'Failed to connect to service. Please try again.',
    )
  })
})
