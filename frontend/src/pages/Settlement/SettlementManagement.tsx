import { Card, Typography } from 'antd'
import { PageHeader } from '@/components'

const { Title, Paragraph } = Typography

const SettlementManagement: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="结算管理"
        subtitle="费用计算、结算处理和财务报表管理"
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

export default SettlementManagement