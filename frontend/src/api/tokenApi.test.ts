import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('./axiosInstance', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

import axiosInstance from './axiosInstance'
import { tokenApi } from './tokenApi'

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

  it('getMyTokens returns raw payload when envelope is missing', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [{ tokenId: 2 }] })
    await expect(tokenApi.getMyTokens()).resolves.toEqual([{ tokenId: 2 }])
  })

  it('getMyTokens maps axios response status to friendly error', async () => {
    mockedAxios.get.mockRejectedValueOnce(
      new AxiosError('forbidden', undefined, undefined, undefined, axiosResponse({}, 403)),
    )

    await expect(tokenApi.getMyTokens()).rejects.toThrow(
      "You don't have permission to access this resource.",
    )
  })

  it('getMyTokens unwraps envelope', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ tokenId: 1 }] } })
    await expect(tokenApi.getMyTokens()).resolves.toEqual([{ tokenId: 1 }])
  })

  it('getServiceCenterQueue unwraps envelope', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ tokenId: 1, position: 2 }] } })
    await expect(tokenApi.getServiceCenterQueue(10)).resolves.toEqual([{ tokenId: 1, position: 2 }])
  })

  it('getServiceCenterQueue falls back to my-tokens when queue route is 404', async () => {
    mockedAxios.get
      .mockRejectedValueOnce(
        new AxiosError('not found', undefined, undefined, undefined, axiosResponse({}, 404)),
      )
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              tokenId: 2,
              centerId: 7,
              tokenNumber: 'A002',
              status: 'Called',
              queuePosition: 2,
              eta: '10m',
            },
            {
              tokenId: 1,
              centerId: 7,
              tokenNumber: 'A001',
              status: 'Waiting',
              queuePosition: 1,
              eta: '5m',
            },
            {
              tokenId: 3,
              centerId: 7,
              tokenNumber: 'A003',
              status: 'Completed',
              queuePosition: 3,
              eta: null,
            },
          ],
        },
      })

    await expect(tokenApi.getServiceCenterQueue(7)).resolves.toEqual([
      { tokenId: 1, tokenNumber: 'A001', status: 'Waiting', position: 1, eta: '5m' },
      { tokenId: 2, tokenNumber: 'A002', status: 'Called', position: 2, eta: '10m' },
    ])
  })

  it('getServiceCenterQueue rethrows non-404 errors as mapped messages', async () => {
    mockedAxios.get.mockRejectedValueOnce(
      new AxiosError('down', undefined, undefined, undefined, axiosResponse({}, 500)),
    )

    await expect(tokenApi.getServiceCenterQueue(10)).rejects.toThrow(
      'Server error. Please try again later.',
    )
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

  it('cancelToken maps token not cancellable and fallback server errors', async () => {
    mockedAxios.put.mockRejectedValueOnce(
      new AxiosError(
        'unprocessable',
        undefined,
        undefined,
        undefined,
        axiosResponse({ code: 'TOKEN_NOT_CANCELLABLE', message: 'Cannot cancel now' }, 422),
      ),
    )

    await expect(tokenApi.cancelToken(6)).rejects.toMatchObject({
      code: 'TOKEN_NOT_CANCELLABLE',
      message: 'Cannot cancel now',
    })

    mockedAxios.put.mockRejectedValueOnce(
      new AxiosError('server', undefined, undefined, undefined, axiosResponse({}, 500)),
    )

    await expect(tokenApi.cancelToken(7)).rejects.toMatchObject({
      code: 'UNKNOWN_ERROR',
      message: 'Server error. Please try again later.',
    })
  })
})
