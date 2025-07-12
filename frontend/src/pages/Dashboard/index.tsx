import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Typography, Progress, List, Avatar, Tag } from 'antd'
import {
  FileTextOutlined,
  TeamOutlined,
  AuditOutlined,
  DollarOutlined,
  TrendingUpOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { PageHeader } from '@/components'
import { useAuthStore } from '@/stores'

const { Title, Text } = Typography

// 模拟数据
const mockStatistics = {
  totalCases: 1250,
  pendingCases: 320,
  inMediationCases: 180,
  completedCases: 750,
  successRate: 68.5,
  monthlyGrowth: 12.5,
}

const mockRecentCases = [
  {
    id: 1,
    caseNo: 'DLMP20250712001',
    debtorName: '张三',
    amount: 50000,
    status: '调解中',
    statusColor: 'blue',
  },
  {
    id: 2,
    caseNo: 'DLMP20250712002',
    debtorName: '李四',
    amount: 80000,
    status: '待分案',
    statusColor: 'orange',
  },
  {
    id: 3,
    caseNo: 'DLMP20250712003',
    debtorName: '王五',
    amount: 120000,
    status: '调解成功',
    statusColor: 'green',
  },
  {
    id: 4,
    caseNo: 'DLMP20250712004',
    debtorName: '赵六',
    amount: 30000,
    status: '诉讼中',
    statusColor: 'purple',
  },
]

const Dashboard: React.FC = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 模拟数据加载
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true)
    // 模拟刷新
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return (
    <div>
      <PageHeader
        title='工作台'
        subtitle={`欢迎回来，${user?.realName || user?.username}`}
        onRefresh={handleRefresh}
        showRefresh
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title='案件总数'
              value={mockStatistics.totalCases}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title='待处理案件'
              value={mockStatistics.pendingCases}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title='调解中案件'
              value={mockStatistics.inMediationCases}
              prefix={<AuditOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title='已完成案件'
              value={mockStatistics.completedCases}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 成功率和增长率 */}
        <Col xs={24} lg={12}>
          <Card title='调解成功率' loading={loading}>
            <div style={{ marginBottom: 24 }}>
              <Progress
                type='circle'
                percent={mockStatistics.successRate}
                format={(percent) => `${percent}%`}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16 }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#52c41a' }}>
                    +{mockStatistics.monthlyGrowth}%
                  </div>
                  <div style={{ color: '#666', fontSize: '12px' }}>本月增长</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#1890ff' }}>
                    {mockStatistics.completedCases}
                  </div>
                  <div style={{ color: '#666', fontSize: '12px' }}>已完成</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 最近案件 */}
        <Col xs={24} lg={12}>
          <Card title='最近案件' loading={loading}>
            <List
              dataSource={mockRecentCases}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{item.caseNo}</Text>
                        <Tag color={item.statusColor}>{item.status}</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div>债务人：{item.debtorName}</div>
                        <div style={{ color: '#1890ff', fontWeight: 600 }}>
                          ¥{item.amount.toLocaleString()}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title='快捷操作'>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.location.hash = '/case/import'}
                >
                  <FileTextOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: 16 }} />
                  <div>案件导入</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.location.hash = '/assignment/management'}
                >
                  <TeamOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: 16 }} />
                  <div>智能分案</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.location.hash = '/mediation/management'}
                >
                  <AuditOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: 16 }} />
                  <div>调解管理</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.location.hash = '/settlement/management'}
                >
                  <DollarOutlined style={{ fontSize: '32px', color: '#722ed1', marginBottom: 16 }} />
                  <div>结算管理</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard