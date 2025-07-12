import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Row,
  Col,
  DatePicker,
  Switch,
  Checkbox,
  Typography,
  Alert,
  Divider,
  Steps,
  Tag,
  Avatar,
  List,
  Modal,
  Transfer
} from 'antd'
import {
  SendOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BellOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { NotificationType, NotificationPriority, User, NotificationTemplate } from '@/types'
import { notificationService, userService } from '@/services'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { Title, Text } = Typography
const { Step } = Steps

interface SendFormData {
  title: string
  content: string
  type: NotificationType
  priority: NotificationPriority
  targetUserIds: number[]
  sendChannels: string[]
  scheduledTime?: string
  expireTime?: string
  templateId?: number
  templateVariables?: Record<string, any>
}

interface SendState {
  currentStep: number
  formData: Partial<SendFormData>
  selectedUsers: User[]
  allUsers: User[]
  templates: NotificationTemplate[]
  loading: boolean
  sending: boolean
}

const NotificationSend: React.FC = () => {
  const [form] = Form.useForm()
  const [state, setState] = useState<SendState>({
    currentStep: 0,
    formData: {},
    selectedUsers: [],
    allUsers: [],
    templates: [],
    loading: false,
    sending: false
  })
  
  const [isUserSelectVisible, setIsUserSelectVisible] = useState(false)
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const [previewContent, setPreviewContent] = useState({ title: '', content: '' })

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await userService.getUserList({
        page: 1,
        size: 1000
      })
      setState(prev => ({ ...prev, allUsers: response.data.records }))
    } catch (error) {
      message.error('获取用户列表失败')
    }
  }

  // 获取模板列表
  const fetchTemplates = async () => {
    try {
      const response = await notificationService.getTemplateList({
        page: 1,
        size: 100
      })
      setState(prev => ({ ...prev, templates: response.data.records }))
    } catch (error) {
      message.error('获取模板列表失败')
    }
  }

  // 选择用户
  const handleUserSelect = (users: User[]) => {
    setState(prev => ({
      ...prev,
      selectedUsers: users,
      formData: {
        ...prev.formData,
        targetUserIds: users.map(user => user.id)
      }
    }))
    form.setFieldsValue({
      targetUserIds: users.map(user => user.id)
    })
    setIsUserSelectVisible(false)
  }

  // 使用模板
  const handleUseTemplate = async (templateId: number) => {
    try {
      const response = await notificationService.getTemplateById(templateId)
      const template = response.data
      
      form.setFieldsValue({
        title: template.title,
        content: template.content,
        type: template.type,
        templateId: templateId
      })
      
      setState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          title: template.title,
          content: template.content,
          type: template.type,
          templateId: templateId
        }
      }))
      
      message.success('模板加载成功')
    } catch (error) {
      message.error('加载模板失败')
    }
  }

  // 预览通知
  const handlePreview = async () => {
    try {
      const values = await form.validateFields()
      
      if (values.templateId) {
        // 使用模板预览
        const response = await notificationService.previewTemplate(
          values.templateId,
          values.templateVariables
        )
        setPreviewContent(response.data)
      } else {
        // 直接预览
        setPreviewContent({
          title: values.title,
          content: values.content
        })
      }
      
      setIsPreviewVisible(true)
    } catch (error) {
      message.warning('请完善通知信息')
    }
  }

  // 发送通知
  const handleSend = async () => {
    try {
      const values = await form.validateFields()
      
      if (!values.targetUserIds || values.targetUserIds.length === 0) {
        message.warning('请选择接收用户')
        return
      }

      setState(prev => ({ ...prev, sending: true }))

      const params = {
        title: values.title,
        content: values.content,
        type: values.type,
        priority: values.priority || NotificationPriority.NORMAL,
        targetUserIds: values.targetUserIds,
        sendChannels: values.sendChannels || ['inApp'],
        scheduledTime: values.scheduledTime,
        expireTime: values.expireTime
      }

      const response = await notificationService.sendNotification(params)
      
      message.success('通知发送成功')
      
      // 显示发送结果
      const successCount = response.data.sendResult.filter(r => r.success).length
      const failCount = response.data.sendResult.filter(r => !r.success).length
      
      Modal.info({
        title: '发送结果',
        content: (
          <div>
            <p>发送成功: {successCount} 人</p>
            <p>发送失败: {failCount} 人</p>
            {failCount > 0 && (
              <div>
                <p>失败详情:</p>
                {response.data.sendResult
                  .filter(r => !r.success)
                  .map((r, index) => (
                    <p key={index}>{r.channel}: {r.error}</p>
                  ))
                }
              </div>
            )}
          </div>
        )
      })

      // 重置表单
      form.resetFields()
      setState(prev => ({
        ...prev,
        currentStep: 0,
        formData: {},
        selectedUsers: [],
        sending: false
      }))
      
    } catch (error) {
      setState(prev => ({ ...prev, sending: false }))
      message.error('发送失败')
    }
  }

  // 下一步
  const handleNext = () => {
    setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))
  }

  // 上一步
  const handlePrev = () => {
    setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))
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

  // 获取优先级文本
  const getPriorityText = (priority: NotificationPriority) => {
    const priorityMap = {
      [NotificationPriority.LOW]: '低',
      [NotificationPriority.NORMAL]: '普通',
      [NotificationPriority.HIGH]: '高',
      [NotificationPriority.URGENT]: '紧急'
    }
    return priorityMap[priority] || '普通'
  }

  useEffect(() => {
    fetchUsers()
    fetchTemplates()
  }, [])

  const steps = [
    {
      title: '编写内容',
      description: '输入通知标题和内容'
    },
    {
      title: '选择接收者',
      description: '选择通知接收用户'
    },
    {
      title: '发送设置',
      description: '设置发送方式和时间'
    }
  ]

  return (
    <div>
      <Card title="发送通知">
        {/* 步骤指示器 */}
        <Steps current={state.currentStep} style={{ marginBottom: 24 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} description={item.description} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSend}
        >
          {/* 第一步：编写内容 */}
          {state.currentStep === 0 && (
            <div>
              <Card title="通知模板" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={18}>
                    <Select
                      placeholder="选择通知模板（可选）"
                      allowClear
                      style={{ width: '100%' }}
                      onChange={handleUseTemplate}
                    >
                      {state.templates.map(template => (
                        <Option key={template.id} value={template.id}>
                          {template.name} - {getTypeText(template.type)}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Button
                      icon={<FileTextOutlined />}
                      onClick={() => message.info('模板管理功能在模板管理页面')}
                    >
                      管理模板
                    </Button>
                  </Col>
                </Row>
              </Card>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="title"
                    label="通知标题"
                    rules={[{ required: true, message: '请输入通知标题' }]}
                  >
                    <Input placeholder="请输入通知标题" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="type"
                    label="通知类型"
                    rules={[{ required: true, message: '请选择通知类型' }]}
                  >
                    <Select placeholder="请选择通知类型">
                      <Option value={NotificationType.SYSTEM}>系统通知</Option>
                      <Option value={NotificationType.CASE_UPDATE}>案件更新</Option>
                      <Option value={NotificationType.ASSIGNMENT}>分案通知</Option>
                      <Option value={NotificationType.MEDIATION}>调解通知</Option>
                      <Option value={NotificationType.LITIGATION}>诉讼通知</Option>
                      <Option value={NotificationType.SETTLEMENT}>结算通知</Option>
                      <Option value={NotificationType.REMINDER}>提醒通知</Option>
                      <Option value={NotificationType.ANNOUNCEMENT}>公告通知</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="priority"
                    label="优先级"
                    initialValue={NotificationPriority.NORMAL}
                  >
                    <Select>
                      <Option value={NotificationPriority.LOW}>低</Option>
                      <Option value={NotificationPriority.NORMAL}>普通</Option>
                      <Option value={NotificationPriority.HIGH}>高</Option>
                      <Option value={NotificationPriority.URGENT}>紧急</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="content"
                label="通知内容"
                rules={[{ required: true, message: '请输入通知内容' }]}
              >
                <TextArea
                  rows={6}
                  placeholder="请输入通知内容"
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Space>
                <Button type="primary" onClick={handleNext}>
                  下一步
                </Button>
                <Button icon={<EyeOutlined />} onClick={handlePreview}>
                  预览
                </Button>
              </Space>
            </div>
          )}

          {/* 第二步：选择接收者 */}
          {state.currentStep === 1 && (
            <div>
              <Alert
                message="接收用户选择"
                description="选择需要接收此通知的用户，可以按部门、角色或单个用户进行选择。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Card title="已选择用户" extra={
                <Button
                  type="primary"
                  icon={<TeamOutlined />}
                  onClick={() => setIsUserSelectVisible(true)}
                >
                  选择用户
                </Button>
              }>
                {state.selectedUsers.length > 0 ? (
                  <List
                    dataSource={state.selectedUsers}
                    renderItem={(user) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={user.realName}
                          description={`${user.username} | ${user.email || user.phone || ''}`}
                        />
                        <Tag>{user.userType === 1 ? '案源客户' : user.userType === 2 ? '调解中心' : '其他'}</Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Alert
                    message="请选择接收用户"
                    type="warning"
                    showIcon
                  />
                )}
              </Card>

              <div style={{ marginTop: 16 }}>
                <Space>
                  <Button onClick={handlePrev}>
                    上一步
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleNext}
                    disabled={state.selectedUsers.length === 0}
                  >
                    下一步
                  </Button>
                </Space>
              </div>
            </div>
          )}

          {/* 第三步：发送设置 */}
          {state.currentStep === 2 && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="sendChannels"
                    label="发送渠道"
                    initialValue={['inApp']}
                    rules={[{ required: true, message: '请选择发送渠道' }]}
                  >
                    <Checkbox.Group>
                      <Checkbox value="inApp">
                        <Space>
                          <BellOutlined />
                          站内通知
                        </Space>
                      </Checkbox>
                      <Checkbox value="email">
                        <Space>
                          <MailOutlined />
                          邮件通知
                        </Space>
                      </Checkbox>
                      <Checkbox value="sms">
                        <Space>
                          <PhoneOutlined />
                          短信通知
                        </Space>
                      </Checkbox>
                    </Checkbox.Group>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="scheduledTime" label="定时发送">
                    <DatePicker
                      showTime
                      placeholder="选择发送时间（留空立即发送）"
                      style={{ width: '100%' }}
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="expireTime" label="过期时间">
                <DatePicker
                  showTime
                  placeholder="选择过期时间（可选）"
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>

              <Alert
                message="发送确认"
                description={
                  <div>
                    <p>接收用户: {state.selectedUsers.length} 人</p>
                    <p>发送渠道: {form.getFieldValue('sendChannels')?.map((channel: string) => {
                      const channelMap: Record<string, string> = {
                        inApp: '站内通知',
                        email: '邮件',
                        sms: '短信'
                      }
                      return channelMap[channel]
                    }).join('、') || '站内通知'}</p>
                    <p>发送方式: {form.getFieldValue('scheduledTime') ? '定时发送' : '立即发送'}</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Space>
                <Button onClick={handlePrev}>
                  上一步
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={state.sending}
                  icon={<SendOutlined />}
                >
                  发送通知
                </Button>
                <Button icon={<EyeOutlined />} onClick={handlePreview}>
                  预览
                </Button>
              </Space>
            </div>
          )}
        </Form>
      </Card>

      {/* 用户选择弹窗 */}
      <Modal
        title="选择接收用户"
        open={isUserSelectVisible}
        onCancel={() => setIsUserSelectVisible(false)}
        width={800}
        footer={null}
      >
        <UserSelectComponent
          users={state.allUsers}
          selectedUsers={state.selectedUsers}
          onSelect={handleUserSelect}
        />
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        title="通知预览"
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsPreviewVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <Card>
          <Title level={4}>{previewContent.title}</Title>
          <Divider />
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {previewContent.content}
          </div>
        </Card>
      </Modal>
    </div>
  )
}

// 用户选择组件
interface UserSelectProps {
  users: User[]
  selectedUsers: User[]
  onSelect: (users: User[]) => void
}

const UserSelectComponent: React.FC<UserSelectProps> = ({ users, selectedUsers, onSelect }) => {
  const [tempSelected, setTempSelected] = useState<User[]>(selectedUsers)

  const handleConfirm = () => {
    onSelect(tempSelected)
  }

  return (
    <div>
      <Transfer
        dataSource={users}
        targetKeys={tempSelected.map(user => user.id.toString())}
        onChange={(targetKeys) => {
          const selected = users.filter(user => targetKeys.includes(user.id.toString()))
          setTempSelected(selected)
        }}
        render={(item) => `${item.realName} (${item.username})`}
        titles={['可选用户', '已选用户']}
        listStyle={{
          width: 300,
          height: 400,
        }}
      />
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button type="primary" onClick={handleConfirm}>
          确定选择 ({tempSelected.length} 人)
        </Button>
      </div>
    </div>
  )
}

export default NotificationSend