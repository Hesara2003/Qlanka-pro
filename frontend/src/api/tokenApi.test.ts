import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('./axiosInstance', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

import axiosInstance from './axiosInstance'
import { CancelTokenError, tokenApi } from './tokenApi'

const mockedAxios = axiosInstance as unknown as {
  get: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
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

describe('tokenApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMyTokens unwraps envelope', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ tokenId: 1 }] } })
    await expect(tokenApi.getMyTokens()).resolves.toEqual([{ tokenId: 1 }])
  })

  it('getServiceCenterQueue unwraps envelope', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ tokenId: 1, position: 2 }] } })
    await expect(tokenApi.getServiceCenterQueue(10)).resolves.toEqual([{ tokenId: 1, position: 2 }])
  })

  it('cancelToken maps auth errors', async () => {
    mockedAxios.put.mockRejectedValueOnce(
      new AxiosError('unauthorized', undefined, undefined, undefined, axiosResponse({}, 401)),
    )

    await expect(tokenApi.cancelToken(1)).rejects.toMatchObject({
      code: 'AUTH_ERROR',
      name: 'CancelTokenError',
    })
  })

  it('cancelToken maps not found and already-cancelled errors', async () => {
    mockedAxios.put.mockRejectedValueOnce(
      new AxiosError(
        'not found',
        undefined,
        undefined,
        undefined,
        axiosResponse({ code: 'TOKEN_NOT_FOUND', message: 'Not found' }, 404),
      ),
    )

    await expect(tokenApi.cancelToken(2)).rejects.toMatchObject({
      code: 'TOKEN_NOT_FOUND',
      message: 'Not found',
    })

    mockedAxios.put.mockRejectedValueOnce(
      new AxiosError(
        'conflict',
        undefined,
        undefined,
        undefined,
        axiosResponse({ code: 'TOKEN_ALREADY_CANCELLED', message: 'Already cancelled' }, 409),
      ),
    )

    await expect(tokenApi.cancelToken(3)).rejects.toMatchObject({
      code: 'TOKEN_ALREADY_CANCELLED',
      message: 'Already cancelled',
    })
  })

  it('cancelToken maps network and unknown errors', async () => {
    mockedAxios.put.mockRejectedValueOnce(new AxiosError('network down'))
    await expect(tokenApi.cancelToken(4)).rejects.toMatchObject({ code: 'NETWORK_ERROR' })

    mockedAxios.put.mockRejectedValueOnce(new Error('boom'))
    await expect(tokenApi.cancelToken(5)).rejects.toMatchObject({ code: 'UNKNOWN_ERROR' })
  })
})
