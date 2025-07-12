import { Button, Space, Typography } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'

const { Title } = Typography

interface PageHeaderProps {
  title: string
  subtitle?: string
  extra?: React.ReactNode
  onAdd?: () => void
  onRefresh?: () => void
  addText?: string
  showAdd?: boolean
  showRefresh?: boolean
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  extra,
  onAdd,
  onRefresh,
  addText = '新增',
  showAdd = false,
  showRefresh = true,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <div>
        <Title level={3} style={{ margin: 0 }}>
          {title}
        </Title>
        {subtitle && (
          <div style={{ color: '#666', marginTop: 4, fontSize: '14px' }}>
            {subtitle}
          </div>
        )}
      </div>
      
      <Space>
        {showRefresh && (
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
          >
            刷新
          </Button>
        )}
        {showAdd && (
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={onAdd}
          >
            {addText}
          </Button>
        )}
        {extra}
      </Space>
    </div>
  )
}

export default PageHeader