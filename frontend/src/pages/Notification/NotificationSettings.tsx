import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Switch,
  Button,
  Space,
  message,
  Row,
  Col,
  Typography,
  Divider,
  TimePicker,
  Table,
  Tag,
  Modal,
  Alert,
  Tabs,
  List,
  Avatar,
  Tooltip
} from 'antd'
import {
  SaveOutlined,
  ReloadOutlined,
  BellOutlined,
  MailOutlined,
  PhoneOutlined,
  SoundOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  TestTubeOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { NotificationSettings, NotificationType, NotificationPriority } from '@/types'
import { notificationService } from '@/services'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TabPane } = Tabs

interface SettingsState {
  settings: NotificationSettings | null
  loading: boolean
  saving: boolean
  subscriptions: Array<{
    topic: string
    topicName: string
    description: string
    subscribeTime: string
  }>
  pushLogs: Array<{
    id: number
    notificationId: number
    channel: string
    target: string
    status: string
    error?: string
    sendTime: string
    deliveryTime?: string
  }>
}

const NotificationSettings: React.FC = () => {
  const [form] = Form.useForm()
  const [testForm] = Form.useForm()
  const [state, setState] = useState<SettingsState>({
    settings: null,
    loading: false,
    saving: false,
    subscriptions: [],
    pushLogs: []
  })
  
  const [isTestModalVisible, setIsTestModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  // 推送日志表格列定义
  const logColumns: ColumnsType<any> = [
    {
      title: '通知ID',
      dataIndex: 'notificationId',
      key: 'notificationId',
      width: 100
    },
    {
      title: '推送渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
      render: (channel: string) => {
        const channelMap = {
          email: { icon: <MailOutlined />, color: 'blue', text: '邮件' },
          sms: { icon: <PhoneOutlined />, color: 'green', text: '短信' },
          inApp: { icon: <BellOutlined />, color: 'orange', text: '站内' }
        }
        const info = channelMap[channel as keyof typeof channelMap]
        return info ? (
          <Tag icon={info.icon} color={info.color}>
            {info.text}
          </Tag>
        ) : channel
      }
    },
    {
      title: '接收目标',
      dataIndex: 'target',
      key: 'target',
      width: 150,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          sent: { color: 'green', text: '已发送' },
          delivered: { color: 'blue', text: '已送达' },
          failed: { color: 'red', text: '发送失败' },
          pending: { color: 'orange', text: '待发送' }
        }
        const info = statusMap[status as keyof typeof statusMap]
        return info ? (
          <Tag color={info.color}>{info.text}</Tag>
        ) : status
      }
    },
    {
      title: '发送时间',
      dataIndex: 'sendTime',
      key: 'sendTime',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '送达时间',
      dataIndex: 'deliveryTime',
      key: 'deliveryTime',
      width: 160,
      render: (time?: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '错误信息',
      dataIndex: 'error',
      key: 'error',
      ellipsis: true,
      render: (error?: string) => error ? (
        <Tooltip title={error}>
          <Text type="danger">{error}</Text>
        </Tooltip>
      ) : '-'
    }
  ]

  // 获取通知设置
  const fetchSettings = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await notificationService.getNotificationSettings()
      setState(prev => ({
        ...prev,
        settings: response.data,
        loading: false
      }))
      
      // 设置表单值
      if (response.data) {
        form.setFieldsValue({
          emailEnabled: response.data.emailEnabled,
          smsEnabled: response.data.smsEnabled,
          inAppEnabled: response.data.inAppEnabled,
          soundEnabled: response.data.soundEnabled,
          quietHoursEnabled: response.data.quietHours?.enabled,
          quietHoursStart: response.data.quietHours?.startTime ? dayjs(response.data.quietHours.startTime, 'HH:mm') : null,
          quietHoursEnd: response.data.quietHours?.endTime ? dayjs(response.data.quietHours.endTime, 'HH:mm') : null,
          typeSettings: response.data.typeSettings?.reduce((acc, setting) => {
            acc[setting.type] = {
              emailEnabled: setting.emailEnabled,
              smsEnabled: setting.smsEnabled,
              inAppEnabled: setting.inAppEnabled
            }
            return acc
          }, {} as any)
        })
      }
    } catch (error) {
      message.error('获取通知设置失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取订阅列表
  const fetchSubscriptions = async () => {
    try {
      const response = await notificationService.getSubscriptions()
      setState(prev => ({
        ...prev,
        subscriptions: response.data
      }))
    } catch (error) {
      message.error('获取订阅列表失败')
    }
  }

  // 获取推送日志
  const fetchPushLogs = async () => {
    try {
      const response = await notificationService.getPushLogs({
        page: 1,
        size: 50
      })
      setState(prev => ({
        ...prev,
        pushLogs: response.data.records
      }))
    } catch (error) {
      message.error('获取推送日志失败')
    }
  }

  // 保存设置
  const handleSave = async () => {
    setState(prev => ({ ...prev, saving: true }))
    try {
      const values = await form.validateFields()
      
      const params = {
        emailEnabled: values.emailEnabled,
        smsEnabled: values.smsEnabled,
        inAppEnabled: values.inAppEnabled,
        soundEnabled: values.soundEnabled,
        typeSettings: Object.entries(values.typeSettings || {}).map(([type, settings]: [string, any]) => ({
          type: parseInt(type) as NotificationType,
          emailEnabled: settings.emailEnabled,
          smsEnabled: settings.smsEnabled,
          inAppEnabled: settings.inAppEnabled
        })),
        quietHours: values.quietHoursEnabled ? {
          enabled: true,
          startTime: values.quietHoursStart.format('HH:mm'),
          endTime: values.quietHoursEnd.format('HH:mm')
        } : { enabled: false, startTime: '22:00', endTime: '08:00' }
      }

      await notificationService.updateNotificationSettings(params)
      message.success('设置保存成功')
      setState(prev => ({ ...prev, saving: false }))
    } catch (error) {
      message.error('设置保存失败')
      setState(prev => ({ ...prev, saving: false }))
    }
  }

  // 重置设置
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要重置为默认设置吗？',
      onOk: async () => {
        try {
          await notificationService.resetNotificationSettings()
          message.success('重置成功')
          fetchSettings()
        } catch (error) {
          message.error('重置失败')
        }
      }
    })
  }

  // 测试推送
  const handleTestPush = async () => {
    try {
      const values = await testForm.validateFields()
      
      const response = await notificationService.testPush(values)
      
      if (response.data.success) {
        message.success('测试推送成功')
      } else {
        message.error(`测试推送失败: ${response.data.message}`)
      }
      
      setIsTestModalVisible(false)
      testForm.resetFields()
    } catch (error) {
      message.error('测试推送失败')
    }
  }

  // 取消订阅
  const handleUnsubscribe = (topic: string) => {
    Modal.confirm({
      title: '确认取消订阅',
      content: `确定要取消订阅 "${topic}" 吗？`,
      onOk: async () => {
        try {
          await notificationService.unsubscribeTopic(topic)
          message.success('取消订阅成功')
          fetchSubscriptions()
        } catch (error) {
          message.error('取消订阅失败')
        }
      }
    })
  }

  // 获取通知类型文本
  const getTypeText = (type: NotificationType) => {
    const typeMap = {
      [NotificationType.SYSTEM]: '系统通知',
      [NotificationType.CASE_UPDATE]: '案件更新',
      [NotificationType.ASSIGNMENT]: '分案通知',
      [NotificationType.MEDIATION]: '调解通知',
      [NotificationType.LITIGATION]: '诉讼通知',
      [NotificationType.SETTLEMENT]: '结算通知',
      [NotificationType.REMINDER]: '提醒通知',
      [NotificationType.ANNOUNCEMENT]: '公告通知'
    }
    return typeMap[type] || '系统通知'
  }

  useEffect(() => {
    if (activeTab === 'basic') {
      fetchSettings()
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions()
    } else if (activeTab === 'logs') {
      fetchPushLogs()
    }
  }, [activeTab])

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 基本设置 */}
        <TabPane tab="基本设置" key="basic">
          <Card 
            title="通知设置" 
            extra={
              <Space>
                <Button
                  icon={<TestTubeOutlined />}
                  onClick={() => setIsTestModalVisible(true)}
                >
                  测试推送
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={state.saving}
                  onClick={handleSave}
                >
                  保存设置
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchSettings}
                >
                  刷新
                </Button>
                <Button
                  danger
                  onClick={handleReset}
                >
                  重置默认
                </Button>
              </Space>
            }
          >
            <Form form={form} layout="vertical">
              {/* 全局设置 */}
              <Title level={4}>
                <SettingOutlined /> 全局设置
              </Title>
              
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item name="inAppEnabled" label="站内通知" valuePropName="checked">
                    <Switch
                      checkedChildren={<BellOutlined />}
                      unCheckedChildren={<BellOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="emailEnabled" label="邮件通知" valuePropName="checked">
                    <Switch
                      checkedChildren={<MailOutlined />}
                      unCheckedChildren={<MailOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="smsEnabled" label="短信通知" valuePropName="checked">
                    <Switch
                      checkedChildren={<PhoneOutlined />}
                      unCheckedChildren={<PhoneOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="soundEnabled" label="声音提醒" valuePropName="checked">
                    <Switch
                      checkedChildren={<SoundOutlined />}
                      unCheckedChildren={<SoundOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              {/* 免打扰时间 */}
              <Title level={4}>
                <ClockCircleOutlined /> 免打扰时间
              </Title>
              
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item name="quietHoursEnabled" label="启用免打扰" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={9}>
                  <Form.Item 
                    name="quietHoursStart" 
                    label="开始时间"
                    dependencies={['quietHoursEnabled']}
                  >
                    <TimePicker
                      format="HH:mm"
                      placeholder="选择开始时间"
                      disabled={!form.getFieldValue('quietHoursEnabled')}
                    />
                  </Form.Item>
                </Col>
                <Col span={9}>
                  <Form.Item 
                    name="quietHoursEnd" 
                    label="结束时间"
                    dependencies={['quietHoursEnabled']}
                  >
                    <TimePicker
                      format="HH:mm"
                      placeholder="选择结束时间"
                      disabled={!form.getFieldValue('quietHoursEnabled')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Alert
                message="免打扰时间说明"
                description="在设定的时间段内，除紧急通知外，其他通知将被延迟发送。"
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Divider />

              {/* 分类设置 */}
              <Title level={4}>
                <BellOutlined /> 分类通知设置
              </Title>
              
              {Object.values(NotificationType).filter(type => typeof type === 'number').map((type) => (
                <Card key={type} size="small" style={{ marginBottom: 16 }}>
                  <Row align="middle">
                    <Col span={6}>
                      <Text strong>{getTypeText(type as NotificationType)}</Text>
                    </Col>
                    <Col span={6}>
                      <Form.Item 
                        name={['typeSettings', type, 'inAppEnabled']} 
                        label="站内通知" 
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch size="small" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item 
                        name={['typeSettings', type, 'emailEnabled']} 
                        label="邮件通知" 
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch size="small" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item 
                        name={['typeSettings', type, 'smsEnabled']} 
                        label="短信通知" 
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch size="small" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Form>
          </Card>
        </TabPane>

        {/* 订阅管理 */}
        <TabPane tab="订阅管理" key="subscriptions">
          <Card title="我的订阅">
            {state.subscriptions.length > 0 ? (
              <List
                dataSource={state.subscriptions}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleUnsubscribe(item.topic)}
                      >
                        取消订阅
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<BellOutlined />} />}
                      title={item.topicName}
                      description={
                        <div>
                          <Text type="secondary">{item.description}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            订阅时间: {dayjs(item.subscribeTime).format('YYYY-MM-DD HH:mm:ss')}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Alert
                message="暂无订阅"
                description="您还没有订阅任何主题通知。"
                type="info"
                showIcon
              />
            )}
          </Card>
        </TabPane>

        {/* 推送日志 */}
        <TabPane tab="推送日志" key="logs">
          <Card 
            title="推送日志" 
            extra={
              <Button icon={<ReloadOutlined />} onClick={fetchPushLogs}>
                刷新
              </Button>
            }
          >
            <Table
              columns={logColumns}
              dataSource={state.pushLogs}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 测试推送弹窗 */}
      <Modal
        title="测试推送"
        open={isTestModalVisible}
        onCancel={() => setIsTestModalVisible(false)}
        onOk={handleTestPush}
        width={500}
      >
        <Form form={testForm} layout="vertical">
          <Alert
            message="测试推送"
            description="选择推送渠道和目标，发送测试通知。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            name="channel"
            label="推送渠道"
            rules={[{ required: true, message: '请选择推送渠道' }]}
          >
            <Select placeholder="请选择推送渠道">
              <Option value="inApp">站内通知</Option>
              <Option value="email">邮件</Option>
              <Option value="sms">短信</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="target"
            label="接收目标"
            rules={[{ required: true, message: '请输入接收目标' }]}
          >
            <Input placeholder="邮箱地址或手机号" />
          </Form.Item>
          
          <Form.Item
            name="title"
            label="通知标题"
            rules={[{ required: true, message: '请输入通知标题' }]}
          >
            <Input placeholder="测试通知标题" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="通知内容"
            rules={[{ required: true, message: '请输入通知内容' }]}
          >
            <TextArea rows={3} placeholder="测试通知内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default NotificationSettings