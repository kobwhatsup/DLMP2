import { Card, Typography } from 'antd'
import { PageHeader } from '@/components'

const { Title, Paragraph } = Typography

const SystemSettings: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="系统设置"
        subtitle="系统配置、参数管理和功能开关控制"
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

export default SystemSettings