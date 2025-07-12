import React, { useState, useEffect } from 'react'
import {
  List,
  Card,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Badge,
  Avatar,
  Typography,
  Empty,
  Spin,
  Row,
  Col,
  Statistic,
  Tag,
  Tooltip,
  Checkbox,
  Drawer,
  Descriptions,
  Timeline,
  Alert
} from 'antd'
import {
  BellOutlined,
  DeleteOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  MessageOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  FireOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import { NotificationRecord, NotificationType, NotificationPriority, NotificationStatus } from '@/types'
import { notificationService } from '@/services'
import { formatDateTime, formatRelativeTime } from '@/utils'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker
const { Text, Title } = Typography
const { confirm } = Modal

interface NotificationListState {
  notifications: NotificationRecord[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  selectedIds: number[]
  stats: {
    totalCount: number
    unreadCount: number
    todayCount: number
    weekCount: number
  }
}

interface SearchParams {
  keyword?: string
  type?: NotificationType
  status?: NotificationStatus
  priority?: NotificationPriority
  dateRange?: string[]
}

const NotificationList: React.FC = () => {
  const [form] = Form.useForm()
  const [listState, setListState] = useState<NotificationListState>({
    notifications: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10,
    selectedIds: [],
    stats: {
      totalCount: 0,
      unreadCount: 0,
      todayCount: 0,
      weekCount: 0
    }
  })
  
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [currentNotification, setCurrentNotification] = useState<NotificationRecord | null>(null)
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false)

  // 获取通知列表
  const fetchNotifications = async () => {
    setListState(prev => ({ ...prev, loading: true }))
    try {
      const response = await notificationService.getMyNotifications({
        ...searchParams,
        page: listState.current,
        size: listState.pageSize
      })
      
      setListState(prev => ({
        ...prev,
        notifications: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取通知列表失败')
      setListState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await notificationService.getNotificationStats()
      setListState(prev => ({ ...prev, stats: response.data }))
    } catch (error) {
      message.error('获取统计信息失败')
    }
  }

  // 搜索
  const handleSearch = (values: SearchParams) => {
    setSearchParams(values)
    setListState(prev => ({ ...prev, current: 1 }))
  }

  // 重置搜索
  const handleReset = () => {
    form.resetFields()
    setSearchParams({})
    setListState(prev => ({ ...prev, current: 1 }))
  }

  // 查看详情
  const handleViewDetail = async (notification: NotificationRecord) => {
    setCurrentNotification(notification)
    setIsDetailDrawerVisible(true)
    
    // 如果是未读状态，标记为已读
    if (notification.status === NotificationStatus.UNREAD) {
      try {
        await notificationService.markAsRead(notification.id)
        // 更新本地状态
        setListState(prev => ({
          ...prev,
          notifications: prev.notifications.map(item =>
            item.id === notification.id
              ? { ...item, status: NotificationStatus.READ, readTime: new Date().toISOString() }
              : item
          ),
          stats: {
            ...prev.stats,
            unreadCount: prev.stats.unreadCount - 1
          }
        }))
      } catch (error) {
        message.error('标记已读失败')
      }
    }
  }

  // 标记为已读
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id)
      message.success('标记已读成功')
      
      // 更新本地状态
      setListState(prev => ({
        ...prev,
        notifications: prev.notifications.map(item =>
          item.id === id
            ? { ...item, status: NotificationStatus.READ, readTime: new Date().toISOString() }
            : item
        ),
        stats: {
          ...prev.stats,
          unreadCount: prev.stats.unreadCount - 1
        }
      }))
    } catch (error) {
      message.error('标记已读失败')
    }
  }

  // 删除通知
  const handleDelete = (id: number) => {
    confirm({
      title: '确认删除',
      content: '确定要删除这条通知吗？',
      onOk: async () => {
        try {
          await notificationService.deleteNotification(id)
          message.success('删除成功')
          fetchNotifications()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  // 批量操作选择
  const handleSelectChange = (id: number, checked: boolean) => {
    setListState(prev => ({
      ...prev,
      selectedIds: checked
        ? [...prev.selectedIds, id]
        : prev.selectedIds.filter(item => item !== id)
    }))
  }

  // 全选/取消全选
  const handleSelectAll = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked
    setListState(prev => ({
      ...prev,
      selectedIds: checked
        ? prev.notifications.map(item => item.id)
        : []
    }))
  }

  // 批量标记已读
  const handleBatchMarkAsRead = async () => {
    if (listState.selectedIds.length === 0) {
      message.warning('请选择要操作的通知')
      return
    }

    try {
      await notificationService.batchMarkAsRead(listState.selectedIds)
      message.success('批量标记已读成功')
      setListState(prev => ({ ...prev, selectedIds: [] }))
      fetchNotifications()
      fetchStats()
    } catch (error) {
      message.error('批量标记已读失败')
    }
  }

  // 批量删除
  const handleBatchDelete = () => {
    if (listState.selectedIds.length === 0) {
      message.warning('请选择要删除的通知')
      return
    }

    confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${listState.selectedIds.length} 条通知吗？`,
      onOk: async () => {
        try {
          await notificationService.batchDeleteNotifications(listState.selectedIds)
          message.success('批量删除成功')
          setListState(prev => ({ ...prev, selectedIds: [] }))
          fetchNotifications()
          fetchStats()
        } catch (error) {
          message.error('批量删除失败')
        }
      }
    })
  }

  // 全部标记为已读
  const handleMarkAllAsRead = () => {
    confirm({
      title: '确认操作',
      content: '确定要将所有通知标记为已读吗？',
      onOk: async () => {
        try {
          await notificationService.markAllAsRead()
          message.success('全部标记已读成功')
          fetchNotifications()
          fetchStats()
        } catch (error) {
          message.error('全部标记已读失败')
        }
      }
    })
  }

  // 清空已读通知
  const handleClearRead = () => {
    confirm({
      title: '确认清空',
      content: '确定要清空所有已读通知吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await notificationService.clearReadNotifications()
          message.success('清空已读通知成功')
          fetchNotifications()
          fetchStats()
        } catch (error) {
          message.error('清空已读通知失败')
        }
      }
    })
  }

  // 获取通知类型图标
  const getTypeIcon = (type: NotificationType) => {
    const iconMap = {
      [NotificationType.SYSTEM]: <BellOutlined />,
      [NotificationType.CASE_UPDATE]: <InfoCircleOutlined />,
      [NotificationType.ASSIGNMENT]: <UserOutlined />,
      [NotificationType.MEDIATION]: <MessageOutlined />,
      [NotificationType.LITIGATION]: <ExclamationCircleOutlined />,
      [NotificationType.SETTLEMENT]: <MailOutlined />,
      [NotificationType.REMINDER]: <ClockCircleOutlined />,
      [NotificationType.ANNOUNCEMENT]: <FireOutlined />
    }
    return iconMap[type] || <BellOutlined />
  }

  // 获取优先级颜色
  const getPriorityColor = (priority: NotificationPriority) => {
    const colorMap = {
      [NotificationPriority.LOW]: '#52c41a',
      [NotificationPriority.NORMAL]: '#1890ff',
      [NotificationPriority.HIGH]: '#faad14',
      [NotificationPriority.URGENT]: '#ff4d4f'
    }
    return colorMap[priority] || '#1890ff'
  }

  // 获取优先级文本
  const getPriorityText = (priority: NotificationPriority) => {
    const textMap = {
      [NotificationPriority.LOW]: '低',
      [NotificationPriority.NORMAL]: '普通',
      [NotificationPriority.HIGH]: '高',
      [NotificationPriority.URGENT]: '紧急'
    }
    return textMap[priority] || '普通'
  }

  // 获取类型文本
  const getTypeText = (type: NotificationType) => {
    const textMap = {
      [NotificationType.SYSTEM]: '系统通知',
      [NotificationType.CASE_UPDATE]: '案件更新',
      [NotificationType.ASSIGNMENT]: '分案通知',
      [NotificationType.MEDIATION]: '调解通知',
      [NotificationType.LITIGATION]: '诉讼通知',
      [NotificationType.SETTLEMENT]: '结算通知',
      [NotificationType.REMINDER]: '提醒通知',
      [NotificationType.ANNOUNCEMENT]: '公告通知'
    }
    return textMap[type] || '系统通知'
  }

  // 分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    setListState(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }))
  }

  useEffect(() => {
    fetchNotifications()
  }, [listState.current, listState.pageSize, searchParams])

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总通知数"
              value={listState.stats.totalCount}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未读数量"
              value={listState.stats.unreadCount}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日通知"
              value={listState.stats.todayCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本周通知"
              value={listState.stats.weekCount}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="搜索标题或内容" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="type" label="通知类型">
                <Select placeholder="请选择类型" allowClear>
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
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态" allowClear>
                  <Option value={NotificationStatus.UNREAD}>未读</Option>
                  <Option value={NotificationStatus.READ}>已读</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="priority" label="优先级">
                <Select placeholder="请选择优先级" allowClear>
                  <Option value={NotificationPriority.LOW}>低</Option>
                  <Option value={NotificationPriority.NORMAL}>普通</Option>
                  <Option value={NotificationPriority.HIGH}>高</Option>
                  <Option value={NotificationPriority.URGENT}>紧急</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="dateRange" label="时间范围">
                <RangePicker placeholder={['开始时间', '结束时间']} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Checkbox
            checked={listState.selectedIds.length === listState.notifications.length && listState.notifications.length > 0}
            indeterminate={listState.selectedIds.length > 0 && listState.selectedIds.length < listState.notifications.length}
            onChange={handleSelectAll}
          >
            全选
          </Checkbox>
          <Button
            icon={<CheckOutlined />}
            onClick={handleBatchMarkAsRead}
            disabled={listState.selectedIds.length === 0}
          >
            批量已读
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleBatchDelete}
            disabled={listState.selectedIds.length === 0}
          >
            批量删除
          </Button>
          <Button
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
          >
            全部已读
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={handleClearRead}
          >
            清空已读
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchNotifications}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 通知列表 */}
      <Card>
        <Spin spinning={listState.loading}>
          {listState.notifications.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={listState.notifications}
              pagination={{
                current: listState.current,
                pageSize: listState.pageSize,
                total: listState.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条通知`,
                onChange: handlePageChange
              }}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{
                    backgroundColor: item.status === NotificationStatus.UNREAD ? '#f6ffed' : 'white',
                    padding: '16px',
                    border: '1px solid #f0f0f0',
                    marginBottom: '8px',
                    borderRadius: '6px'
                  }}
                  actions={[
                    <Checkbox
                      checked={listState.selectedIds.includes(item.id)}
                      onChange={(e) => handleSelectChange(item.id, e.target.checked)}
                    />,
                    item.status === NotificationStatus.UNREAD && (
                      <Tooltip title="标记已读">
                        <Button
                          type="link"
                          icon={<CheckOutlined />}
                          size="small"
                          onClick={() => handleMarkAsRead(item.id)}
                        />
                      </Tooltip>
                    ),
                    <Tooltip title="查看详情">
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleViewDetail(item)}
                      />
                    </Tooltip>,
                    <Tooltip title="删除">
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDelete(item.id)}
                      />
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge dot={item.status === NotificationStatus.UNREAD}>
                        <Avatar
                          icon={getTypeIcon(item.type)}
                          style={{ backgroundColor: getPriorityColor(item.priority) }}
                        />
                      </Badge>
                    }
                    title={
                      <Space>
                        <span style={{ fontWeight: item.status === NotificationStatus.UNREAD ? 'bold' : 'normal' }}>
                          {item.title}
                        </span>
                        <Tag color={getPriorityColor(item.priority)}>
                          {getPriorityText(item.priority)}
                        </Tag>
                        <Tag>{getTypeText(item.type)}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text
                          ellipsis={{ rows: 2, expandable: false }}
                          style={{ color: '#666', marginBottom: '4px', display: 'block' }}
                        >
                          {item.content}
                        </Text>
                        <Space size="small">
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {formatRelativeTime(item.createTime)}
                          </Text>
                          {item.senderName && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              发送人: {item.senderName}
                            </Text>
                          )}
                          {item.expireTime && new Date(item.expireTime) > new Date() && (
                            <Text type="warning" style={{ fontSize: '12px' }}>
                              过期时间: {formatDateTime(item.expireTime)}
                            </Text>
                          )}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无通知" />
          )}
        </Spin>
      </Card>

      {/* 通知详情抽屉 */}
      <Drawer
        title="通知详情"
        placement="right"
        onClose={() => setIsDetailDrawerVisible(false)}
        open={isDetailDrawerVisible}
        width={600}
      >
        {currentNotification && (
          <div>
            <Descriptions title="基本信息" bordered column={1}>
              <Descriptions.Item label="标题">
                <Space>
                  {currentNotification.title}
                  {currentNotification.status === NotificationStatus.UNREAD && (
                    <Badge status="processing" text="未读" />
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag color="blue">{getTypeText(currentNotification.type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={getPriorityColor(currentNotification.priority)}>
                  {getPriorityText(currentNotification.priority)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发送人">
                {currentNotification.senderName || '系统'}
              </Descriptions.Item>
              <Descriptions.Item label="接收时间">
                {formatDateTime(currentNotification.createTime)}
              </Descriptions.Item>
              {currentNotification.readTime && (
                <Descriptions.Item label="阅读时间">
                  {formatDateTime(currentNotification.readTime)}
                </Descriptions.Item>
              )}
              {currentNotification.expireTime && (
                <Descriptions.Item label="过期时间">
                  {formatDateTime(currentNotification.expireTime)}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Title level={5}>通知内容</Title>
              <Alert
                message={currentNotification.content}
                type="info"
                showIcon
              />
            </div>

            {currentNotification.actions && currentNotification.actions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>可执行操作</Title>
                <Space>
                  {currentNotification.actions.map((action, index) => (
                    <Button
                      key={index}
                      type={action.type === 'primary' ? 'primary' : 'default'}
                      onClick={() => {
                        if (action.url) {
                          window.open(action.url, '_blank')
                        }
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Space>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default NotificationList