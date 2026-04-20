import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServiceCenter } from '../../types/serviceCenter'
import ServiceCenterCard from './ServiceCenterCard'

const mockNavigate = vi.fn()
const mockUseAuth = vi.fn()
const mockDownloadDailyCenterSummaryCsv = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../../api/reportsApi', () => ({
  downloadDailyCenterSummaryCsv: (...args: unknown[]) => mockDownloadDailyCenterSummaryCsv(...args),
}))

const sampleCenter: ServiceCenter = {
  centerId: 11,
  name: 'Main Office',
  address: '123 Main Road',
  timezone: 'Asia/Colombo',
  capacity: 200,
  averageServiceTimeMinutes: 14,
  openingTime: '08:00',
  closingTime: '17:00',
  isAvailable: true,
  isActive: true,
  createdAt: '2026-03-10T00:00:00Z',
}

describe('ServiceCenterCard', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseAuth.mockReset()
    mockDownloadDailyCenterSummaryCsv.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows queue booking action for non-admin users', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'citizen' } })

    render(
      <MemoryRouter>
        <ServiceCenterCard center={sampleCenter} />
      </MemoryRouter>,
    )

    const joinQueueButton = screen.getByRole('button', { name: /join queue/i })
    expect(joinQueueButton).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /download csv/i })).not.toBeInTheDocument()

    fireEvent.click(joinQueueButton)
    expect(mockNavigate).toHaveBeenCalledWith('/book/11')
  })

  it('exports CSV with selected date range for admin users', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'admin' } })
    mockDownloadDailyCenterSummaryCsv.mockResolvedValue(undefined)

    const { container } = render(
      <MemoryRouter>
        <ServiceCenterCard center={sampleCenter} />
      </MemoryRouter>,
    )

    const dateInputs = container.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBe(2)

    fireEvent.change(dateInputs[0], { target: { value: '2026-03-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-30' } })

    fireEvent.click(screen.getByRole('button', { name: /download csv/i }))

    await waitFor(() => {
      expect(mockDownloadDailyCenterSummaryCsv).toHaveBeenCalledWith(11, '2026-03-01', '2026-03-30')
    })
  })

  it('shows loading state while export is in progress', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'admin' } })

    let resolveExport: (() => void) | null = null
    const pendingExport = new Promise<void>((resolve) => {
      resolveExport = resolve
    })
    mockDownloadDailyCenterSummaryCsv.mockReturnValue(pendingExport)

    render(
      <MemoryRouter>
        <ServiceCenterCard center={sampleCenter} />
      </MemoryRouter>,
    )

    const exportButton = screen.getByRole('button', { name: /download csv/i })
    fireEvent.click(exportButton)

    expect(screen.getByRole('button', { name: /exporting/i })).toBeDisabled()

    resolveExport?.()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /download csv/i })).not.toBeDisabled()
    })
  })

  it('shows export error message when download fails', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'admin' } })
    mockDownloadDailyCenterSummaryCsv.mockRejectedValue(new Error('Report service unavailable'))

    render(
      <MemoryRouter>
        <ServiceCenterCard center={sampleCenter} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /download csv/i }))

    expect(await screen.findByText('Report service unavailable')).toBeInTheDocument()
  })
})
