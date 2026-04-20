import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServiceCenter } from '../types/serviceCenter'
import type { AdminUser } from '../types/user'

const getAllServiceCentersMock = vi.hoisted(() => vi.fn<() => Promise<ServiceCenter[]>>())
const getAdminUsersMock = vi.hoisted(() => vi.fn<() => Promise<AdminUser[]>>())

async function renderAdminDashboard() {
  vi.resetModules()

  vi.doMock('../api/serviceCenterApi', () => ({
    getAllServiceCenters: getAllServiceCentersMock,
  }))

  vi.doMock('../api/userApi', () => ({
    getAdminUsers: getAdminUsersMock,
  }))

  vi.doMock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: unknown }) => <div data-testid="chart-container">{children}</div>,
    BarChart: ({ children }: { children: unknown }) => <div>{children}</div>,
    Bar: ({ children }: { children: unknown }) => <div>{children}</div>,
    Cell: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
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
    getAdminUsersMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders dashboard metrics derived from fetched API data', async () => {
    getAllServiceCentersMock.mockResolvedValue([
      {
        centerId: 1,
        name: 'Colombo Center',
        address: '1 Main St',
        timezone: 'Asia/Colombo',
        capacity: 120,
        averageServiceTimeMinutes: 10,
        openingTime: '08:00',
        closingTime: '17:00',
        isAvailable: true,
        isActive: true,
        createdAt: '2026-03-01T00:00:00Z',
      },
      {
        centerId: 2,
        name: 'Kandy Center',
        address: '2 Main St',
        timezone: 'Asia/Colombo',
        capacity: 90,
        averageServiceTimeMinutes: 12,
        openingTime: '08:00',
        closingTime: '17:00',
        isAvailable: true,
        isActive: true,
        createdAt: '2026-03-01T00:00:00Z',
      },
    ])

    getAdminUsersMock.mockResolvedValue([
      {
        userId: 1,
        username: 'citizen-1',
        email: 'c1@example.com',
        role: 'citizen',
        centerId: null,
        isActive: true,
        isEmailVerified: true,
        isDeleted: false,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: null,
        lastLoginAt: null,
      },
      {
        userId: 2,
        username: 'citizen-2',
        email: 'c2@example.com',
        role: 'citizen',
        centerId: null,
        isActive: true,
        isEmailVerified: false,
        isDeleted: false,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: null,
        lastLoginAt: null,
      },
      {
        userId: 3,
        username: 'officer-1',
        email: 'o1@example.com',
        role: 'officer',
        centerId: 1,
        isActive: true,
        isEmailVerified: true,
        isDeleted: false,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: null,
        lastLoginAt: null,
      },
      {
        userId: 4,
        username: 'admin-1',
        email: 'a1@example.com',
        role: 'admin',
        centerId: null,
        isActive: true,
        isEmailVerified: true,
        isDeleted: false,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: null,
        lastLoginAt: null,
      },
      {
        userId: 5,
        username: 'officer-2',
        email: 'o2@example.com',
        role: 'officer',
        centerId: 2,
        isActive: false,
        isEmailVerified: false,
        isDeleted: false,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: null,
        lastLoginAt: null,
      },
    ])

    const { container } = await renderAdminDashboard()

    await waitFor(() => {
      expect(getAllServiceCentersMock).toHaveBeenCalledTimes(1)
      expect(getAdminUsersMock).toHaveBeenCalledTimes(1)
    })

    const activeMembersLabel = screen.getByText('Currently Active Members')
    expect(activeMembersLabel.previousElementSibling).toHaveTextContent('4')

    const totalUsersBadge = screen.getByText('Total')
    expect(totalUsersBadge.previousElementSibling).toHaveTextContent('5')

    expect(screen.getByText('User Distribution')).toBeInTheDocument()
    expect(screen.getByText('Citizens')).toBeInTheDocument()
    expect(screen.getByText('Officers')).toBeInTheDocument()
    expect(screen.getByText('Admins')).toBeInTheDocument()

    // Ensure the rendered dashboard has expected quick shortcuts.
    expect(container.textContent).toContain('Manage Users')
    expect(container.textContent).toContain('Create Center')
  })

  it('falls back to zeroed stats if data fetch fails', async () => {
    getAllServiceCentersMock.mockRejectedValue(new Error('service centers failed'))
    getAdminUsersMock.mockRejectedValue(new Error('users failed'))

    await renderAdminDashboard()

    const activeMembersLabel = await screen.findByText('Currently Active Members')
    expect(activeMembersLabel.previousElementSibling).toHaveTextContent('0')

    const totalUsersBadge = screen.getByText('Total')
    expect(totalUsersBadge.previousElementSibling).toHaveTextContent('0')
  })

  it('re-fetches dashboard data when refresh is clicked', async () => {
    getAllServiceCentersMock.mockResolvedValue([])
    getAdminUsersMock.mockResolvedValue([])

    await renderAdminDashboard()

    await waitFor(() => {
      expect(getAllServiceCentersMock).toHaveBeenCalledTimes(1)
      expect(getAdminUsersMock).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }))

    await waitFor(() => {
      expect(getAllServiceCentersMock).toHaveBeenCalledTimes(2)
      expect(getAdminUsersMock).toHaveBeenCalledTimes(2)
    })
  })
})
