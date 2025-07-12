import { Card, Typography } from 'antd'
import { PageHeader } from '@/components'

const { Title, Paragraph } = Typography

const AssignmentManagement: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="智能分案"
        subtitle="基于规则引擎的智能分案管理，配置分案规则和查看分案结果"
        showRefresh
      />
      
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Title level={3}>功能开发中</Title>
          <Paragraph type="secondary">
            该功能正在开发中，敬请期待...
          </Paragraph>
        </div>
      </Card>
    </div>
  )
}

export default AssignmentManagement