import { Breadcrumb as AntBreadcrumb } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores'

const Breadcrumb: React.FC = () => {
  const navigate = useNavigate()
  const { breadcrumbs } = useAppStore()

  // 处理面包屑点击
  const handleBreadcrumbClick = (path?: string) => {
    if (path) {
      navigate(path)
    }
  }

  // 转换面包屑数据格式
  const breadcrumbItems = breadcrumbs.map((item, index) => ({
    title: item.path ? (
      <span
        style={{ cursor: 'pointer', color: index === breadcrumbs.length - 1 ? undefined : '#1890ff' }}
        onClick={() => handleBreadcrumbClick(item.path)}
      >
        {item.label}
      </span>
    ) : (
      item.label
    ),
  }))

  return (
    <AntBreadcrumb
      style={{
        margin: '16px 0',
      }}
      items={breadcrumbItems}
    />
  )
}

export default Breadcrumb