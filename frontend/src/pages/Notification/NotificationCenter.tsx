import { Card, Typography } from 'antd'
import { PageHeader } from '@/components'

const { Title, Paragraph } = Typography

const NotificationCenter: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="消息中心"
        subtitle="系统通知、消息推送和提醒管理"
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

export default NotificationCenter