import { Tag } from 'antd'
import { CaseStatus, AssignmentStatus, UserType } from '@/types'

interface StatusTagProps {
  type: 'case' | 'assignment' | 'user'
  status: number
}

const StatusTag: React.FC<StatusTagProps> = ({ type, status }) => {
  // 案件状态标签
  if (type === 'case') {
    switch (status) {
      case CaseStatus.PENDING_ASSIGNMENT:
        return <Tag color='orange'>待分案</Tag>
      case CaseStatus.IN_MEDIATION:
        return <Tag color='blue'>调解中</Tag>
      case CaseStatus.MEDIATION_SUCCESS:
        return <Tag color='green'>调解成功</Tag>
      case CaseStatus.MEDIATION_FAILED:
        return <Tag color='red'>调解失败</Tag>
      case CaseStatus.IN_LITIGATION:
        return <Tag color='purple'>诉讼中</Tag>
      case CaseStatus.CLOSED:
        return <Tag color='default'>已结案</Tag>
      default:
        return <Tag>未知状态</Tag>
    }
  }

  // 分案状态标签
  if (type === 'assignment') {
    switch (status) {
      case AssignmentStatus.UNASSIGNED:
        return <Tag color='orange'>未分案</Tag>
      case AssignmentStatus.ASSIGNED:
        return <Tag color='green'>已分案</Tag>
      default:
        return <Tag>未知状态</Tag>
    }
  }

  // 用户类型标签
  if (type === 'user') {
    switch (status) {
      case UserType.CASE_SOURCE_CLIENT:
        return <Tag color='blue'>案源端客户</Tag>
      case UserType.MEDIATION_CENTER:
        return <Tag color='green'>调解中心</Tag>
      case UserType.PLATFORM_OPERATOR:
        return <Tag color='purple'>平台运营方</Tag>
      case UserType.COURT:
        return <Tag color='orange'>法院用户</Tag>
      default:
        return <Tag>未知类型</Tag>
    }
  }

  return <Tag>未知</Tag>
}

export default StatusTag