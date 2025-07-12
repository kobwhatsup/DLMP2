import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import StatusTag from '../StatusTag'
import { CaseStatus, AssignmentStatus, UserType } from '@/types'

describe('StatusTag', () => {
  it('renders case status correctly', () => {
    render(<StatusTag type='case' status={CaseStatus.PENDING_ASSIGNMENT} />)
    expect(screen.getByText('待分案')).toBeInTheDocument()
  })

  it('renders assignment status correctly', () => {
    render(<StatusTag type='assignment' status={AssignmentStatus.ASSIGNED} />)
    expect(screen.getByText('已分案')).toBeInTheDocument()
  })

  it('renders user type correctly', () => {
    render(<StatusTag type='user' status={UserType.PLATFORM_OPERATOR} />)
    expect(screen.getByText('平台运营方')).toBeInTheDocument()
  })

  it('renders unknown status for invalid input', () => {
    render(<StatusTag type='case' status={999} />)
    expect(screen.getByText('未知状态')).toBeInTheDocument()
  })
})