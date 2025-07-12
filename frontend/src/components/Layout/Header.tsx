import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layout,
  Button,
  Dropdown,
  Avatar,
  Badge,
  Space,
  Modal,
  message,
  Typography,
} from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { useAuthStore, useAppStore } from '@/stores'
import { authService } from '@/services'

const { Header: AntHeader } = Layout
const { Text } = Typography

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const [logoutLoading, setLogoutLoading] = useState(false)

  // 处理登出
  const handleLogout = async () => {
    Modal.confirm({
      title: '确认登出',
      content: '您确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLogoutLoading(true)
          await authService.logout()
          logout()
          message.success('已安全退出')
          navigate('/login', { replace: true })
        } catch (error) {
          // 即使接口失败也要清除本地状态
          logout()
          navigate('/login', { replace: true })
        } finally {
          setLogoutLoading(false)
        }
      },
    })
  }

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => {
        // TODO: 跳转到个人信息页面
        message.info('个人信息功能开发中')
      },
    },
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => {
        // TODO: 打开修改密码弹窗
        message.info('修改密码功能开发中')
      },
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => {
        // TODO: 跳转到设置页面
        message.info('设置功能开发中')
      },
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  // 通知下拉菜单
  const notificationMenuItems = [
    {
      key: 'view-all',
      label: '查看全部通知',
      onClick: () => {
        navigate('/notification/center')
      },
    },
  ]

  return (
    <AntHeader
      style={{
        padding: '0 16px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* 左侧：折叠按钮和标题 */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type='text'
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          style={{ fontSize: '16px', width: 64, height: 64 }}
        />
      </div>

      {/* 右侧：通知、用户信息 */}
      <Space size='middle'>
        {/* 通知铃铛 */}
        <Dropdown
          menu={{ items: notificationMenuItems }}
          placement='bottomRight'
          trigger={['click']}
        >
          <Badge count={5} size='small'>
            <Button
              type='text'
              icon={<BellOutlined />}
              style={{ fontSize: '16px' }}
            />
          </Badge>
        </Dropdown>

        {/* 用户信息 */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement='bottomRight'
          trigger={['click']}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Avatar size='small' icon={<UserOutlined />} style={{ marginRight: 8 }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Text strong style={{ fontSize: '14px', lineHeight: 1.2 }}>
                {user?.realName || user?.username}
              </Text>
              <Text type='secondary' style={{ fontSize: '12px', lineHeight: 1.2 }}>
                {user?.userType === 1 && '案源端客户'}
                {user?.userType === 2 && '调解中心'}
                {user?.userType === 3 && '平台运营方'}
                {user?.userType === 4 && '法院用户'}
              </Text>
            </div>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}

export default Header