import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { UserToken } from '../api/tokenApi'
import DashboardPage from './DashboardPage'

const useAuthMock = vi.hoisted(() => vi.fn())
const useTokensMock = vi.hoisted(() => vi.fn())
const useQueueHubMock = vi.hoisted(() => vi.fn())
const useToastMock = vi.hoisted(() => vi.fn())

vi.mock('../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../hooks/useTokens', () => ({
  useTokens: () => useTokensMock(),
}))

vi.mock('../hooks/useQueueHub', () => ({
  useQueueHub: () => useQueueHubMock(),
}))

vi.mock('../hooks/useToast', () => ({
  useToast: () => useToastMock(),
}))

vi.mock('../components/common/ToastContainer', () => ({
  default: () => null,
}))

vi.mock('../components/dashboard/UserTokenCard', () => ({
  UserTokenCard: ({ token }: { token: UserToken }) => <div data-testid="token-card">{token.tokenNumber}</div>,
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

function buildToken(overrides?: Partial<UserToken>): UserToken {
  return {
    tokenId: 1,
    centerId: 10,
    centerName: 'Central Office',
    tokenNumber: 'A-001',
    issuedDate: '2026-04-20',
    status: 'Waiting',
    issuedTime: '2026-04-20T09:00:00Z',
    estimatedServiceTime: null,
    servedTime: null,
    completedTime: null,
    cancelledAt: null,
    queuePosition: 1,
    eta: '2026-04-20T09:20:00Z',
    ...overrides,
  }
}

describe('DashboardPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    useAuthMock.mockReturnValue({ user: { role: 'citizen', username: 'citizen-1' } })
    useQueueHubMock.mockReturnValue({
      latestCalledToken: null,
      latestStatusUpdate: null,
      latestCancellation: null,
      latestQueueUpdate: null,
    })
    useToastMock.mockReturnValue({
      toasts: [],
      addToast: vi.fn(),
      removeToast: vi.fn(),
    })

    useTokensMock.mockReturnValue({
      tokens: [],
      loading: false,
      error: null,
      lastUpdated: new Date('2026-04-20T10:30:00Z'),
      refresh: vi.fn(),
      cancelToken: vi.fn(),
    })
  })

  it('shows loading state while tokens are being fetched', () => {
    useTokensMock.mockReturnValue({
      tokens: [],
      loading: true,
      error: null,
      lastUpdated: null,
      refresh: vi.fn(),
      cancelToken: vi.fn(),
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/fetching your queue positions/i)).toBeInTheDocument()
  })

  it('shows empty-state prompt when user has no active tokens', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/no active tokens/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /find a service center/i })).toBeInTheDocument()
  })

  it('renders token cards when active tokens exist', () => {
    useTokensMock.mockReturnValue({
      tokens: [buildToken({ tokenId: 1, tokenNumber: 'A-101' }), buildToken({ tokenId: 2, tokenNumber: 'A-102' })],
      loading: false,
      error: null,
      lastUpdated: new Date('2026-04-20T10:30:00Z'),
      refresh: vi.fn(),
      cancelToken: vi.fn(),
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getAllByText(/active queue positions/i).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('token-card')).toHaveLength(2)
    expect(screen.getByText('A-101')).toBeInTheDocument()
    expect(screen.getByText('A-102')).toBeInTheDocument()
  })

  it('shows API error when token fetch fails', () => {
    useTokensMock.mockReturnValue({
      tokens: [],
      loading: false,
      error: 'Unable to reach token service',
      lastUpdated: null,
      refresh: vi.fn(),
      cancelToken: vi.fn(),
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/failed to load tokens/i)).toBeInTheDocument()
    expect(screen.getByText(/unable to reach token service/i)).toBeInTheDocument()
  })

  it('calls refresh when user clicks the refresh button', () => {
    const refreshSpy = vi.fn()
    useTokensMock.mockReturnValue({
      tokens: [buildToken({ tokenId: 1, tokenNumber: 'A-111' })],
      loading: false,
      error: null,
      lastUpdated: new Date('2026-04-20T10:30:00Z'),
      refresh: refreshSpy,
      cancelToken: vi.fn(),
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: /refresh/i })[0])
    expect(refreshSpy).toHaveBeenCalledTimes(1)
  })
})
