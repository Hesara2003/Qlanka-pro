import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./axiosInstance', () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
  },
}))

import axiosInstance from './axiosInstance'
import { deleteAdminUser, getAdminUsers } from './userApi'

const mockedAxios = axiosInstance as unknown as {
  delete: ReturnType<typeof vi.fn>
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

describe('userApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns admin users and forwards params', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [{ userId: 1, username: 'admin' }] },
    })

    const users = await getAdminUsers({ role: 'admin' })

    expect(users).toEqual([{ userId: 1, username: 'admin' }])
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/admin/users', {
      params: { role: 'admin' },
    })
  })

  it('maps backend code to friendly message', async () => {
    mockedAxios.get.mockRejectedValueOnce(
      new AxiosError(
        'forbidden',
        undefined,
        undefined,
        undefined,
        axiosResponse({ code: 'FORBIDDEN' }, 403),
      ),
    )

    await expect(getAdminUsers()).rejects.toThrow(
      'You do not have permission to perform this action.',
    )
  })

  it('deleteAdminUser calls endpoint and maps network timeout', async () => {
    mockedAxios.delete.mockResolvedValueOnce({})
    await expect(deleteAdminUser(5)).resolves.toBeUndefined()
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/admin/users/5')

    mockedAxios.delete.mockRejectedValueOnce(new AxiosError('timeout', 'ECONNABORTED'))
    await expect(deleteAdminUser(5)).rejects.toThrow('Request timeout. Please try again.')
  })
})
