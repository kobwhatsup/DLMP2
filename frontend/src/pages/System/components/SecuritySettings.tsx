import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Alert,
  List,
  Tag,
  Modal,
  message,
  Divider,
  Select,
  TimePicker
} from 'antd'
import {
  SecurityScanOutlined,
  LockOutlined,
  SafetyOutlined,
  WarningOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined
} from '@ant-design/icons'
import { SecuritySettings } from '@/types'
import { systemService } from '@/services'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const SecuritySettingsComponent: React.FC = () => {
  const [passwordForm] = Form.useForm()
  const [loginForm] = Form.useForm()
  const [ipForm] = Form.useForm()
  
  const [settings, setSettings] = useState<SecuritySettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [newWhitelistIp, setNewWhitelistIp] = useState('')
  const [newBlacklistIp, setNewBlacklistIp] = useState('')

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await systemService.getSecuritySettings()
      setSettings(response.data)
      
      // 设置表单初始值
      passwordForm.setFieldsValue(response.data.passwordPolicy)
      loginForm.setFieldsValue(response.data.loginSettings)
    } catch (error) {
      message.error('获取安全设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordPolicyUpdate = async (values: any) => {
    try {
      await systemService.updatePasswordPolicy(values)
      message.success('密码策略更新成功')
      fetchSettings()
    } catch (error) {
      message.error('更新密码策略失败')
    }
  }

  const handleLoginSettingsUpdate = async (values: any) => {
    try {
      await systemService.updateLoginSettings(values)
      message.success('登录设置更新成功')
      fetchSettings()
    } catch (error) {
      message.error('更新登录设置失败')
    }
  }

  const handleAddWhitelistIp = async () => {
    if (!newWhitelistIp.trim()) {
      message.warning('请输入IP地址')
      return
    }

    const newList = [...(settings?.ipWhitelist || []), newWhitelistIp.trim()]
    try {
      await systemService.updateIpWhitelist(newList)
      message.success('添加白名单成功')
      setNewWhitelistIp('')
      fetchSettings()
    } catch (error) {
      message.error('添加白名单失败')
    }
  }

  const handleRemoveWhitelistIp = async (ip: string) => {
    const newList = settings?.ipWhitelist.filter(item => item !== ip) || []
    try {
      await systemService.updateIpWhitelist(newList)
      message.success('移除白名单成功')
      fetchSettings()
    } catch (error) {
      message.error('移除白名单失败')
    }
  }

  const handleAddBlacklistIp = async () => {
    if (!newBlacklistIp.trim()) {
      message.warning('请输入IP地址')
      return
    }

    const newList = [...(settings?.ipBlacklist || []), newBlacklistIp.trim()]
    try {
      await systemService.updateIpBlacklist(newList)
      message.success('添加黑名单成功')
      setNewBlacklistIp('')
      fetchSettings()
    } catch (error) {
      message.error('添加黑名单失败')
    }
  }

  const handleRemoveBlacklistIp = async (ip: string) => {
    const newList = settings?.ipBlacklist.filter(item => item !== ip) || []
    try {
      await systemService.updateIpBlacklist(newList)
      message.success('移除黑名单成功')
      fetchSettings()
    } catch (error) {
      message.error('移除黑名单失败')
    }
  }

  const handleFileSettingsUpdate = async (field: string, value: any) => {
    try {
      await systemService.updateSecuritySettings({ [field]: value })
      message.success('文件安全设置更新成功')
      fetchSettings()
    } catch (error) {
      message.error('更新文件安全设置失败')
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (!settings) {
    return <Card loading={loading}>加载中...</Card>
  }

  return (
    <div>
      <Row gutter={16}>
        {/* 密码策略 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <LockOutlined />
                密码策略
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordPolicyUpdate}
              initialValues={settings.passwordPolicy}
            >
              <Form.Item
                name="minLength"
                label="最小长度"
                rules={[{ required: true, min: 6, max: 32, type: 'number' }]}
              >
                <InputNumber min={6} max={32} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="requireUppercase" valuePropName="checked">
                <Switch /> <Text>要求大写字母</Text>
              </Form.Item>

              <Form.Item name="requireLowercase" valuePropName="checked">
                <Switch /> <Text>要求小写字母</Text>
              </Form.Item>

              <Form.Item name="requireNumbers" valuePropName="checked">
                <Switch /> <Text>要求数字</Text>
              </Form.Item>

              <Form.Item name="requireSpecialChars" valuePropName="checked">
                <Switch /> <Text>要求特殊字符</Text>
              </Form.Item>

              <Form.Item
                name="maxAge"
                label="密码有效期（天）"
                rules={[{ type: 'number', min: 30, max: 365 }]}
              >
                <InputNumber min={30} max={365} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="historyCount"
                label="历史密码记录数"
                rules={[{ type: 'number', min: 1, max: 24 }]}
              >
                <InputNumber min={1} max={24} style={{ width: '100%' }} />
              </Form.Item>

              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                保存密码策略
              </Button>
            </Form>
          </Card>
        </Col>

        {/* 登录设置 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <SafetyOutlined />
                登录安全
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Form
              form={loginForm}
              layout="vertical"
              onFinish={handleLoginSettingsUpdate}
              initialValues={settings.loginSettings}
            >
              <Form.Item
                name="maxFailAttempts"
                label="最大失败次数"
                rules={[{ required: true, type: 'number', min: 3, max: 10 }]}
              >
                <InputNumber min={3} max={10} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="lockoutDuration"
                label="锁定时间（分钟）"
                rules={[{ required: true, type: 'number', min: 5, max: 1440 }]}
              >
                <InputNumber min={5} max={1440} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="sessionTimeout"
                label="会话超时（小时）"
                rules={[{ required: true, type: 'number', min: 1, max: 24 }]}
              >
                <InputNumber min={1} max={24} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="multipleLoginAllowed" valuePropName="checked">
                <Switch /> <Text>允许多设备登录</Text>
              </Form.Item>

              <Form.Item name="requireCaptcha" valuePropName="checked">
                <Switch /> <Text>要求验证码</Text>
              </Form.Item>

              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                保存登录设置
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* IP白名单 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <SecurityScanOutlined />
                IP白名单
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="输入IP地址或网段，如 192.168.1.1 或 192.168.1.0/24"
                value={newWhitelistIp}
                onChange={(e) => setNewWhitelistIp(e.target.value)}
                onPressEnter={handleAddWhitelistIp}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddWhitelistIp}>
                添加
              </Button>
            </Space.Compact>

            <List
              dataSource={settings.ipWhitelist}
              renderItem={(ip) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveWhitelistIp(ip)}
                    />
                  ]}
                >
                  <Tag color="green">{ip}</Tag>
                </List.Item>
              )}
              style={{ maxHeight: 300, overflow: 'auto' }}
            />

            <Alert
              message="白名单说明"
              description="只有白名单中的IP地址才能访问系统。留空表示不限制访问IP。"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>

        {/* IP黑名单 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <WarningOutlined />
                IP黑名单
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="输入IP地址或网段，如 192.168.1.1 或 192.168.1.0/24"
                value={newBlacklistIp}
                onChange={(e) => setNewBlacklistIp(e.target.value)}
                onPressEnter={handleAddBlacklistIp}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBlacklistIp}>
                添加
              </Button>
            </Space.Compact>

            <List
              dataSource={settings.ipBlacklist}
              renderItem={(ip) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveBlacklistIp(ip)}
                    />
                  ]}
                >
                  <Tag color="red">{ip}</Tag>
                </List.Item>
              )}
              style={{ maxHeight: 300, overflow: 'auto' }}
            />

            <Alert
              message="黑名单说明"
              description="黑名单中的IP地址将被禁止访问系统。"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 其他安全设置 */}
      <Card 
        title={
          <Space>
            <SecurityScanOutlined />
            其他安全设置
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>双因素认证</Text>
              <br />
              <Switch
                checked={settings.enableTwoFactor}
                onChange={(checked) => handleFileSettingsUpdate('enableTwoFactor', checked)}
              />
              <Text type="secondary" style={{ marginLeft: 8 }}>
                启用后用户需要绑定手机或邮箱
              </Text>
            </div>
          </Col>

          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>最大上传文件大小（MB）</Text>
              <br />
              <InputNumber
                value={settings.maxUploadSize}
                min={1}
                max={1024}
                onChange={(value) => handleFileSettingsUpdate('maxUploadSize', value)}
                style={{ width: 120 }}
              />
            </div>
          </Col>

          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>允许上传的文件类型</Text>
              <br />
              <Select
                mode="tags"
                style={{ width: '100%' }}
                value={settings.allowedFileTypes}
                onChange={(value) => handleFileSettingsUpdate('allowedFileTypes', value)}
                placeholder="输入文件扩展名，如 .jpg .pdf"
              >
                <Option value=".jpg">图片(.jpg)</Option>
                <Option value=".png">图片(.png)</Option>
                <Option value=".pdf">文档(.pdf)</Option>
                <Option value=".doc">文档(.doc)</Option>
                <Option value=".docx">文档(.docx)</Option>
                <Option value=".xls">表格(.xls)</Option>
                <Option value=".xlsx">表格(.xlsx)</Option>
              </Select>
            </div>
          </Col>
        </Row>

        <Alert
          message="安全建议"
          description={
            <div>
              <p>• 建议启用强密码策略和双因素认证</p>
              <p>• 定期更新IP白名单，移除不必要的访问权限</p>
              <p>• 限制文件上传大小和类型，防止恶意文件上传</p>
              <p>• 监控登录失败记录，及时发现异常登录行为</p>
            </div>
          }
          type="info"
          showIcon
        />
      </Card>
    </div>
  )
}

export default SecuritySettingsComponent