import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('./axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import axiosInstance from './axiosInstance'
import { bookToken, getMyAppointments } from './appointmentApi'

const mockedAxios = axiosInstance as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
}

describe('appointmentApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('bookToken unwraps api envelope data', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          appointmentId: 100,
          centerId: 1,
          userId: 20,
          tokenNumber: 'A001',
          appointmentDate: '2026-03-30',
          appointmentTime: '10:00:00',
          status: 'Booked',
          createdAt: '2026-03-30T10:00:00Z',
        },
      },
    })

    const result = await bookToken({
      centerId: 1,
      appointmentDate: '2026-03-30T00:00:00Z',
      appointmentTime: '10:00:00',
    })

    expect(result.tokenNumber).toBe('A001')
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/appointment/book', {
      centerId: 1,
      appointmentDate: '2026-03-30T00:00:00Z',
      appointmentTime: '10:00:00',
    })
  })

  it('getMyAppointments unwraps list data', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            appointmentId: 100,
            centerId: 1,
            userId: 20,
            tokenNumber: 'A001',
            appointmentDate: '2026-03-30',
            appointmentTime: '10:00:00',
            status: 'Booked',
            createdAt: '2026-03-30T10:00:00Z',
          },
        ],
      },
    })

    const result = await getMyAppointments()

    expect(result).toHaveLength(1)
    expect(result[0]?.appointmentId).toBe(100)
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/appointment/my-bookings')
  })
})
