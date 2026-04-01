import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('./axiosInstance', () => ({
  default: {
    post: vi.fn(),
  },
}))

import axiosInstance from './axiosInstance'
import { loginUser, registerUser } from './authApi'

const mockedAxios = axiosInstance as unknown as {
  post: ReturnType<typeof vi.fn>
}

function axiosResponse(data: unknown, status = 400): AxiosResponse {
  return {
    data,
    status,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig,
  }
}

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registerUser returns response payload', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { userId: 1, username: 'alice', role: 'citizen' },
    })

    await expect(
      registerUser({
        username: 'alice',
        email: 'alice@example.com',
        password: 'Strong1@',
        role: 'citizen',
      }),
    ).resolves.toEqual({ userId: 1, username: 'alice', role: 'citizen' })
  })

  it('loginUser returns response payload', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        token: 't',
        refreshToken: 'r',
        expiresIn: 3600,
        role: 'citizen',
      },
    })

    await expect(loginUser({ username: 'alice', password: 'Strong1@' })).resolves.toEqual({
      token: 't',
      refreshToken: 'r',
      expiresIn: 3600,
      role: 'citizen',
    })
  })

  it('maps axios error message from backend', async () => {
    const error = new AxiosError(
      'Request failed',
      undefined,
      undefined,
      undefined,
      axiosResponse({ message: 'Invalid credentials' }, 401),
    )
    mockedAxios.post.mockRejectedValueOnce(error)

    await expect(loginUser({ username: 'alice', password: 'bad' })).rejects.toThrow(
      'Invalid credentials',
    )
  })

  it('maps unknown errors to network fallback message', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('boom'))

    await expect(loginUser({ username: 'alice', password: 'bad' })).rejects.toThrow(
      'Network error. Please try again.',
    )
  })
})
