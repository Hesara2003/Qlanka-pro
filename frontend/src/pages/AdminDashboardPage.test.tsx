import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { ServiceCenter } from '../types/serviceCenter'

const getAllServiceCentersMock = vi.hoisted(() => vi.fn<() => Promise<ServiceCenter[]>>())
const getCustomReportMock = vi.hoisted(() => vi.fn())
const getCenterSummaryRowsMock = vi.hoisted(() => vi.fn())

async function renderAdminDashboard() {
  vi.resetModules()

  vi.doMock('../api/serviceCenterApi', () => ({
    getAllServiceCenters: getAllServiceCentersMock,
  }))

  vi.doMock('../api/reportsApi', () => ({
    getCustomReport: (...args: unknown[]) => getCustomReportMock(...args),
    getCenterSummaryRows: (...args: unknown[]) => getCenterSummaryRowsMock(...args),
  }))

  vi.doMock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div data-testid="chart-container">{children}</div>,
    BarChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Bar: () => <div />,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  }))

  const module = await import('./AdminDashboardPage')

  return render(
    <MemoryRouter>
      <module.default />
    </MemoryRouter>,
  )
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    getAllServiceCentersMock.mockReset()
    getCustomReportMock.mockReset()
    getCenterSummaryRowsMock.mockReset()

    getAllServiceCentersMock.mockResolvedValue([
      {
        centerId: 11,
        name: 'Main Center',
        address: '1 Main St',
        timezone: 'Asia/Colombo',
        capacity: 100,
        averageServiceTimeMinutes: 10,
        openingTime: '08:00',
        closingTime: '17:00',
        isAvailable: true,
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        centerId: 12,
        name: 'North Center',
        address: '2 Main St',
        timezone: 'Asia/Colombo',
        capacity: 80,
        averageServiceTimeMinutes: 12,
        openingTime: '08:00',
        closingTime: '17:00',
        isAvailable: true,
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])

    getCustomReportMock.mockResolvedValue({
      groupBy: 'date',
      metrics: ['total_tokens_issued', 'total_served', 'total_skipped', 'avg_wait_time_seconds'],
      page: 1,
      pageSize: 500,
      totalGroups: 2,
      rows: [
        {
          date: '2026-03-10',
          metrics: {
            total_tokens_issued: 50,
            total_served: 42,
            total_skipped: 5,
            avg_wait_time_seconds: 300,
          },
        },
        {
          date: '2026-03-11',
          metrics: {
            total_tokens_issued: 40,
            total_served: 35,
            total_skipped: 3,
            avg_wait_time_seconds: 240,
          },
        },
      ],
    })

    getCenterSummaryRowsMock.mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
  })

  it('renders analytics cards from report endpoint data', async () => {
    await renderAdminDashboard()

    await waitFor(() => {
      expect(getCustomReportMock).toHaveBeenCalledTimes(1)
    })

    // Totals from mocked rows: bookings 90, served 77, skipped 8
    expect(screen.getByText('90')).toBeInTheDocument()
    expect(screen.getByText('77')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()

    // Weighted avg wait: ((5 * 50) + (4 * 40)) / 90 = 4.56 => 4.6 min
    expect(screen.getByText('4.6 min')).toBeInTheDocument()

    expect(screen.getByText('Daily Bookings Trend')).toBeInTheDocument()
    expect(screen.getByText('Served vs Skipped')).toBeInTheDocument()
    expect(screen.getByText('Average Wait Time Trend')).toBeInTheDocument()
    expect(screen.getByText('Peak Hours')).toBeInTheDocument()
  })

  it('updates report query when center filter changes', async () => {
    await renderAdminDashboard()

    await waitFor(() => {
      expect(getCustomReportMock).toHaveBeenCalledTimes(1)
    })

    fireEvent.change(screen.getByLabelText('Center'), { target: { value: '11' } })

    await waitFor(() => {
      expect(getCustomReportMock).toHaveBeenCalledTimes(2)
    })

    const lastCustomReportCallArg = getCustomReportMock.mock.calls[1][0]
    expect(lastCustomReportCallArg.centerIds).toEqual([11])

    await waitFor(() => {
      expect(getCenterSummaryRowsMock).toHaveBeenCalledWith(11, expect.any(String), expect.any(String))
    })
  })

  it('updates report query when date filters change', async () => {
    await renderAdminDashboard()

    await waitFor(() => {
      expect(getCustomReportMock).toHaveBeenCalledTimes(1)
    })

    const fromInput = screen.getByLabelText('From')
    const toInput = screen.getByLabelText('To')

    fireEvent.change(fromInput, { target: { value: '2026-03-01' } })
    fireEvent.change(toInput, { target: { value: '2026-03-20' } })

    await waitFor(() => {
      expect(getCustomReportMock).toHaveBeenCalledTimes(3)
    })

    const finalCallArg = getCustomReportMock.mock.calls[2][0]
    expect(finalCallArg.fromDate).toBe('2026-03-01')
    expect(finalCallArg.toDate).toBe('2026-03-20')
  })

  it('uses default 30-day range on initial load', async () => {
    await renderAdminDashboard()

    await waitFor(() => {
      expect(getCustomReportMock).toHaveBeenCalledTimes(1)
    })

    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 29)

    const expectedFrom = thirtyDaysAgo.toISOString().slice(0, 10)
    const expectedTo = today.toISOString().slice(0, 10)

    const initialCallArg = getCustomReportMock.mock.calls[0][0]
    expect(initialCallArg.fromDate).toBe(expectedFrom)
    expect(initialCallArg.toDate).toBe(expectedTo)
  })
})
