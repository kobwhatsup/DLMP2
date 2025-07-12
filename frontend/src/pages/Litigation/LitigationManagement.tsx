import { Card, Typography } from 'antd'
import { PageHeader } from '@/components'

const { Title, Paragraph } = Typography

const LitigationManagement: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="诉讼管理"
        subtitle="跟踪诉讼进度、管理法律文书和执行监控"
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

export default LitigationManagement