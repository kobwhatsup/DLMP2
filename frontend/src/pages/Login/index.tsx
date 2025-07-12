import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message, Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores'
import { userService } from '@/services'
import type { LoginRequest } from '@/types'

const { Title, Text } = Typography

const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuthStore()

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  // 处理登录
  const handleLogin = async (values: LoginRequest) => {
    try {
      setLoading(true)
      const response = await userService.login(values)
      
      // 获取用户详细信息
      const userInfo = await userService.getCurrentUser()

      // 保存登录状态
      login(userInfo, response.token)
      
      message.success('登录成功')
      
      // 跳转到目标页面
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (error: any) {
      message.error(error.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#001529', marginBottom: 8 }}>
            诉讼调解平台
          </Title>
          <Text type='secondary'>个贷不良资产分散诉讼调解平台</Text>
        </div>

        {/* 登录表单 */}
        <Form
          form={form}
          name='login'
          onFinish={handleLogin}
          autoComplete='off'
          size='large'
        >
          <Form.Item
            name='username'
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder='用户名'
              autoComplete='username'
            />
          </Form.Item>

          <Form.Item
            name='password'
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='密码'
              autoComplete='current-password'
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name='remember' valuePropName='checked' noStyle>
                <Checkbox>记住密码</Checkbox>
              </Form.Item>
              <Button type='link' style={{ padding: 0 }}>
                忘记密码？
              </Button>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
              loading={loading}
              style={{ width: '100%', height: 40 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* 测试账号提示 */}
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: '#f6f8fa',
            borderRadius: 6,
            fontSize: '12px',
            color: '#666',
          }}
        >
          <div style={{ marginBottom: 8, fontWeight: 600 }}>测试账号：</div>
          <div>管理员：admin / 123456</div>
          <div>用户：user / 123456</div>
        </div>
      </Card>
    </div>
  )
}

export default Login