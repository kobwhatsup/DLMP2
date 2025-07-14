import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import StatusTag from '../StatusTag'
import { CaseStatus, AssignmentStatus, UserType, MediationStatus, LitigationStatus, SettlementStatus } from '@/types'

describe('StatusTag', () => {
  describe('Case Status', () => {
    it('renders pending assignment status', () => {
      render(<StatusTag type='case' status={CaseStatus.PENDING_ASSIGNMENT} />)
      const tag = screen.getByText('待分案')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-orange')
    })

    it('renders assigned status', () => {
      render(<StatusTag type='case' status={CaseStatus.ASSIGNED} />)
      const tag = screen.getByText('已分案')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-blue')
    })

    it('renders in mediation status', () => {
      render(<StatusTag type='case' status={CaseStatus.IN_MEDIATION} />)
      const tag = screen.getByText('调解中')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-processing')
    })

    it('renders mediation success status', () => {
      render(<StatusTag type='case' status={CaseStatus.MEDIATION_SUCCESS} />)
      const tag = screen.getByText('调解成功')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-success')
    })

    it('renders mediation failed status', () => {
      render(<StatusTag type='case' status={CaseStatus.MEDIATION_FAILED} />)
      const tag = screen.getByText('调解失败')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-error')
    })

    it('renders in litigation status', () => {
      render(<StatusTag type='case' status={CaseStatus.IN_LITIGATION} />)
      const tag = screen.getByText('诉讼中')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-purple')
    })

    it('renders litigation success status', () => {
      render(<StatusTag type='case' status={CaseStatus.LITIGATION_SUCCESS} />)
      const tag = screen.getByText('诉讼成功')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-green')
    })

    it('renders closed status', () => {
      render(<StatusTag type='case' status={CaseStatus.CLOSED} />)
      const tag = screen.getByText('已结案')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-default')
    })
  })

  describe('Assignment Status', () => {
    it('renders unassigned status', () => {
      render(<StatusTag type='assignment' status={AssignmentStatus.UNASSIGNED} />)
      const tag = screen.getByText('未分案')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-default')
    })

    it('renders assigned status', () => {
      render(<StatusTag type='assignment' status={AssignmentStatus.ASSIGNED} />)
      const tag = screen.getByText('已分案')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-success')
    })
  })

  describe('User Type', () => {
    it('renders case source client type', () => {
      render(<StatusTag type='user' status={UserType.CASE_SOURCE_CLIENT} />)
      const tag = screen.getByText('案源端客户')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-blue')
    })

    it('renders mediation center type', () => {
      render(<StatusTag type='user' status={UserType.MEDIATION_CENTER} />)
      const tag = screen.getByText('调解中心')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-green')
    })

    it('renders platform operator type', () => {
      render(<StatusTag type='user' status={UserType.PLATFORM_OPERATOR} />)
      const tag = screen.getByText('平台运营方')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-purple')
    })

    it('renders court type', () => {
      render(<StatusTag type='user' status={UserType.COURT} />)
      const tag = screen.getByText('法院用户')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-orange')
    })

    it('renders debtor type', () => {
      render(<StatusTag type='user' status={UserType.DEBTOR} />)
      const tag = screen.getByText('债务人')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-default')
    })
  })

  describe('Mediation Status', () => {
    it('renders pending mediation status', () => {
      render(<StatusTag type='mediation' status={MediationStatus.PENDING} />)
      const tag = screen.getByText('待开始')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-default')
    })

    it('renders in progress mediation status', () => {
      render(<StatusTag type='mediation' status={MediationStatus.IN_PROGRESS} />)
      const tag = screen.getByText('进行中')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-processing')
    })

    it('renders successful mediation status', () => {
      render(<StatusTag type='mediation' status={MediationStatus.SUCCESS} />)
      const tag = screen.getByText('调解成功')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-success')
    })

    it('renders failed mediation status', () => {
      render(<StatusTag type='mediation' status={MediationStatus.FAILED} />)
      const tag = screen.getByText('调解失败')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-error')
    })

    it('renders suspended mediation status', () => {
      render(<StatusTag type='mediation' status={MediationStatus.SUSPENDED} />)
      const tag = screen.getByText('已暂停')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-warning')
    })
  })

  describe('Error Cases', () => {
    it('renders unknown status for invalid case status', () => {
      render(<StatusTag type='case' status={999} />)
      const tag = screen.getByText('未知状态')
      expect(tag).toBeInTheDocument()
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-default')
    })

    it('renders unknown status for invalid assignment status', () => {
      render(<StatusTag type='assignment' status={-1} />)
      const tag = screen.getByText('未知状态')
      expect(tag).toBeInTheDocument()
    })

    it('renders unknown status for invalid user type', () => {
      render(<StatusTag type='user' status={0} />)
      const tag = screen.getByText('未知状态')
      expect(tag).toBeInTheDocument()
    })

    it('handles undefined status gracefully', () => {
      render(<StatusTag type='case' status={undefined as any} />)
      const tag = screen.getByText('未知状态')
      expect(tag).toBeInTheDocument()
    })

    it('handles null status gracefully', () => {
      render(<StatusTag type='user' status={null as any} />)
      const tag = screen.getByText('未知状态')
      expect(tag).toBeInTheDocument()
    })
  })

  describe('Props', () => {
    it('accepts custom className', () => {
      render(<StatusTag type='case' status={CaseStatus.ASSIGNED} className='custom-class' />)
      const tag = screen.getByText('已分案')
      expect(tag.closest('.ant-tag')).toHaveClass('custom-class')
    })

    it('accepts custom style', () => {
      const customStyle = { marginLeft: '10px' }
      render(<StatusTag type='case' status={CaseStatus.ASSIGNED} style={customStyle} />)
      const tag = screen.getByText('已分案')
      expect(tag.closest('.ant-tag')).toHaveStyle('margin-left: 10px')
    })

    it('passes through other props', () => {
      render(<StatusTag type='case' status={CaseStatus.ASSIGNED} data-testid='status-tag' />)
      const tag = screen.getByTestId('status-tag')
      expect(tag).toBeInTheDocument()
    })
  })
})