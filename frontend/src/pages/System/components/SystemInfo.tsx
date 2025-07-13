import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Descriptions,
  Typography,
  Space,
  Button,
  Alert,
  Progress,
  Badge,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Statistic,
  Divider
} from 'antd'
import {
  InfoCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  UpgradeOutlined,
  SafetyCertificateOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  CodeOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { systemService } from '@/services'

const { Title, Text, Paragraph } = Typography

interface SystemInfoData {
  version: string
  buildTime: string
  buildNumber: string
  javaVersion: string
  osName: string
  osVersion: string
  architecture: string
  serverName: string
  serverPort: number
  contextPath: string
  activeProfiles: string[]
  dataSourceUrl: string
  redisVersion: string
  elasticsearchVersion: string
  diskSpace: {
    total: number
    free: number
    used: number
    usagePercent: number
  }
  license: {
    type: string
    expireDate?: string
    maxUsers: number
    currentUsers: number
    features: string[]
    valid: boolean
  }
  update: {
    currentVersion: string
    latestVersion: string
    hasUpdate: boolean
    updateNotes?: string
  }
}

const SystemInfoComponent: React.FC = () => {
  const [form] = Form.useForm()
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLicenseModalVisible, setIsLicenseModalVisible] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchSystemInfo = async () => {
    setLoading(true)
    try {
      const response = await systemService.getSystemInfo()
      setSystemInfo(response.data)
    } catch (error) {
      message.error('获取系统信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true)
    try {
      const response = await systemService.checkUpdate()
      setSystemInfo(prev => prev ? { ...prev, update: response.data } : null)
      if (response.data.hasUpdate) {
        message.success(`发现新版本: ${response.data.latestVersion}`)
      } else {
        message.info('当前已是最新版本')
      }
    } catch (error) {
      message.error('检查更新失败')
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await systemService.downloadUpdate()
      message.success('更新包下载完成，系统将在安装后重启')
      
      setTimeout(async () => {
        try {
          await systemService.installUpdate()
          message.success('更新安装中，系统即将重启')
        } catch (error) {
          message.error('安装更新失败')
        }
      }, 2000)
    } catch (error) {
      message.error('下载更新失败')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateLicense = async (values: any) => {
    try {
      await systemService.updateLicense(values.licenseKey)
      message.success('许可证更新成功')
      setIsLicenseModalVisible(false)
      fetchSystemInfo()
    } catch (error) {
      message.error('更新许可证失败')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getLicenseStatus = () => {
    if (!systemInfo?.license) return { status: 'error', text: '无许可证' }
    
    if (!systemInfo.license.valid) {
      return { status: 'error', text: '许可证无效' }
    }
    
    if (systemInfo.license.expireDate) {
      const expireDate = new Date(systemInfo.license.expireDate)
      const now = new Date()
      const daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysLeft <= 0) {
        return { status: 'error', text: '已过期' }
      } else if (daysLeft <= 30) {
        return { status: 'warning', text: `${daysLeft}天后过期` }
      }
    }
    
    return { status: 'success', text: '正常' }
  }

  useEffect(() => {
    fetchSystemInfo()
  }, [])

  if (!systemInfo) {
    return <Card loading={loading}>加载中...</Card>
  }

  const licenseStatus = getLicenseStatus()

  return (
    <div>
      {/* 系统概览 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="系统版本"
              value={systemInfo.version}
              prefix={<CodeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线用户"
              value={systemInfo.license.currentUsers}
              suffix={`/ ${systemInfo.license.maxUsers}`}
              prefix={<TeamOutlined />}
              valueStyle={{ 
                color: systemInfo.license.currentUsers > systemInfo.license.maxUsers * 0.8 ? '#faad14' : '#52c41a' 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="磁盘使用率"
              value={systemInfo.diskSpace.usagePercent}
              precision={1}
              suffix="%"
              prefix={<DatabaseOutlined />}
              valueStyle={{ 
                color: systemInfo.diskSpace.usagePercent > 80 ? '#ff4d4f' : 
                       systemInfo.diskSpace.usagePercent > 60 ? '#faad14' : '#52c41a' 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical">
                <div>
                  {licenseStatus.status === 'success' && <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                  {licenseStatus.status === 'warning' && <ExclamationCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />}
                  {licenseStatus.status === 'error' && <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />}
                </div>
                <div>
                  <Text strong>许可证状态</Text>
                  <br />
                  <Text>{licenseStatus.text}</Text>
                </div>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                <InfoCircleOutlined /> 系统信息
              </Title>
              <Text type="secondary">
                查看系统运行环境和配置信息
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<UpgradeOutlined />} 
                onClick={handleCheckUpdate}
                loading={checkingUpdate}
              >
                检查更新
              </Button>
              {systemInfo.update.hasUpdate && (
                <Button 
                  type="primary" 
                  icon={<UpgradeOutlined />}
                  onClick={handleUpdate}
                  loading={updating}
                >
                  立即更新
                </Button>
              )}
              <Button
                icon={<SafetyCertificateOutlined />}
                onClick={() => setIsLicenseModalVisible(true)}
              >
                管理许可证
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchSystemInfo}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 版本更新提醒 */}
      {systemInfo.update.hasUpdate && (
        <Alert
          message="发现新版本"
          description={
            <div>
              <p>当前版本: {systemInfo.update.currentVersion}</p>
              <p>最新版本: {systemInfo.update.latestVersion}</p>
              {systemInfo.update.updateNotes && (
                <div>
                  <p>更新内容:</p>
                  <pre style={{ background: '#f5f5f5', padding: 8, fontSize: 12 }}>
                    {systemInfo.update.updateNotes}
                  </pre>
                </div>
              )}
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        {/* 系统信息 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <CloudServerOutlined />
                系统信息
              </Space>
            } 
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="应用版本">{systemInfo.version}</Descriptions.Item>
              <Descriptions.Item label="构建时间">{systemInfo.buildTime}</Descriptions.Item>
              <Descriptions.Item label="构建编号">{systemInfo.buildNumber}</Descriptions.Item>
              <Descriptions.Item label="服务器名称">{systemInfo.serverName}</Descriptions.Item>
              <Descriptions.Item label="服务端口">{systemInfo.serverPort}</Descriptions.Item>
              <Descriptions.Item label="上下文路径">{systemInfo.contextPath}</Descriptions.Item>
              <Descriptions.Item label="运行环境">
                <Space>
                  {systemInfo.activeProfiles.map(profile => (
                    <Tag key={profile} color="blue">{profile}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 运行环境 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <SettingOutlined />
                运行环境
              </Space>
            } 
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="操作系统">{systemInfo.osName}</Descriptions.Item>
              <Descriptions.Item label="系统版本">{systemInfo.osVersion}</Descriptions.Item>
              <Descriptions.Item label="系统架构">{systemInfo.architecture}</Descriptions.Item>
              <Descriptions.Item label="Java版本">{systemInfo.javaVersion}</Descriptions.Item>
              <Descriptions.Item label="Redis版本">{systemInfo.redisVersion}</Descriptions.Item>
              <Descriptions.Item label="ES版本">{systemInfo.elasticsearchVersion}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 磁盘空间 */}
      <Card 
        title={
          <Space>
            <DatabaseOutlined />
            存储空间
          </Space>
        } 
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={systemInfo.diskSpace.usagePercent}
                format={percent => (
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>{percent}%</div>
                    <div style={{ fontSize: 12, color: '#666' }}>已使用</div>
                  </div>
                )}
                width={180}
                strokeColor={
                  systemInfo.diskSpace.usagePercent > 80 ? '#ff4d4f' : 
                  systemInfo.diskSpace.usagePercent > 60 ? '#faad14' : '#52c41a'
                }
              />
            </div>
          </Col>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>总容量: </Text>
                <Text>{formatBytes(systemInfo.diskSpace.total)}</Text>
              </div>
              <div>
                <Text strong>已使用: </Text>
                <Text>{formatBytes(systemInfo.diskSpace.used)}</Text>
              </div>
              <div>
                <Text strong>可用空间: </Text>
                <Text>{formatBytes(systemInfo.diskSpace.free)}</Text>
              </div>
              <Divider />
              <Alert
                message="存储建议"
                description="建议当存储使用率超过80%时及时清理不必要的文件或扩容存储空间。"
                type={systemInfo.diskSpace.usagePercent > 80 ? 'warning' : 'info'}
                showIcon
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 许可证信息 */}
      <Card 
        title={
          <Space>
            <SafetyCertificateOutlined />
            许可证信息
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="许可证类型">{systemInfo.license.type}</Descriptions.Item>
          <Descriptions.Item label="最大用户数">{systemInfo.license.maxUsers}</Descriptions.Item>
          <Descriptions.Item label="当前用户数">{systemInfo.license.currentUsers}</Descriptions.Item>
          <Descriptions.Item label="过期时间">
            {systemInfo.license.expireDate || '永久有效'}
          </Descriptions.Item>
          <Descriptions.Item label="许可状态" span={2}>
            <Badge 
              status={licenseStatus.status as any} 
              text={licenseStatus.text} 
            />
          </Descriptions.Item>
          <Descriptions.Item label="授权功能" span={2}>
            <Space wrap>
              {systemInfo.license.features.map(feature => (
                <Tag key={feature} color="green">{feature}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 许可证管理弹窗 */}
      <Modal
        title="许可证管理"
        open={isLicenseModalVisible}
        onCancel={() => setIsLicenseModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateLicense}>
          <Form.Item
            name="licenseKey"
            label="许可证密钥"
            rules={[{ required: true, message: '请输入许可证密钥' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder="请输入完整的许可证密钥..."
            />
          </Form.Item>

          <Alert
            message="许可证说明"
            description={
              <div>
                <p>• 请确保许可证密钥的完整性和准确性</p>
                <p>• 更新许可证后系统功能可能会发生变化</p>
                <p>• 如有疑问请联系技术支持</p>
              </div>
            }
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  )
}

export default SystemInfoComponent