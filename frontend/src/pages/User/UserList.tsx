import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  message,
  Form,
  Input,
  Select,
  Card,
  Row,
  Col,
  Tag,
  Popconfirm,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { User, UserType, UserStatus } from '@/types'
import { userService } from '@/services'
import StatusTag from '@/components/Common/StatusTag'
import { formatDateTime } from '@/utils'

const { Option } = Select
const { Search } = Input

interface UserListState {
  users: User[]
  loading: boolean
  total: number
  current: number
  pageSize: number
}

interface SearchParams {
  username?: string
  realName?: string
  phone?: string
  userType?: UserType
  status?: UserStatus
}

const UserList: React.FC = () => {
  const [listState, setListState] = useState<UserListState>({
    users: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10
  })
  
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      ellipsis: true
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 100,
      ellipsis: true
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (phone: string) => phone ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : '-'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 150,
      ellipsis: true
    },
    {
      title: '用户类型',
      dataIndex: 'userType',
      key: 'userType',
      width: 120,
      render: (userType: UserType) => (
        <StatusTag type="user" status={userType} />
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: UserStatus) => (
        <Tag color={status === UserStatus.ACTIVE ? 'green' : 'red'}>
          {status === UserStatus.ACTIVE ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => formatDateTime(time)
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      width: 160,
      render: (time: string) => time ? formatDateTime(time) : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除该用户吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ]

  // 获取用户列表
  const fetchUsers = async () => {
    setListState(prev => ({ ...prev, loading: true }))
    try {
      const response = await userService.getUserList({
        ...searchParams,
        page: listState.current,
        size: listState.pageSize
      })
      
      setListState(prev => ({
        ...prev,
        users: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取用户列表失败')
      setListState(prev => ({ ...prev, loading: false }))
    }
  }

  // 搜索
  const handleSearch = (params: SearchParams) => {
    setSearchParams(params)
    setListState(prev => ({ ...prev, current: 1 }))
  }

  // 重置搜索
  const handleReset = () => {
    setSearchParams({})
    setListState(prev => ({ ...prev, current: 1 }))
  }

  // 新增用户
  const handleAdd = () => {
    setEditingUser(null)
    setIsModalVisible(true)
    form.resetFields()
  }

  // 编辑用户
  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsModalVisible(true)
    form.setFieldsValue(user)
  }

  // 删除用户
  const handleDelete = async (id: number) => {
    try {
      await userService.deleteUser(id)
      message.success('删除成功')
      fetchUsers()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 保存用户
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingUser) {
        await userService.updateUser(editingUser.id, values)
        message.success('更新成功')
      } else {
        await userService.createUser(values)
        message.success('创建成功')
      }
      
      setIsModalVisible(false)
      fetchUsers()
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请检查表单填写')
      } else {
        message.error(editingUser ? '更新失败' : '创建失败')
      }
    }
  }

  // 导出数据
  const handleExport = async () => {
    try {
      const response = await userService.exportUsers(searchParams)
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `用户列表_${new Date().toISOString().slice(0, 10)}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 表格变化处理
  const handleTableChange = (pagination: any) => {
    setListState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  useEffect(() => {
    fetchUsers()
  }, [listState.current, listState.pageSize, searchParams])

  return (
    <div>
      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          layout="inline"
          onFinish={handleSearch}
          initialValues={searchParams}
        >
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="username" label="用户名">
                <Input placeholder="请输入用户名" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="realName" label="真实姓名">
                <Input placeholder="请输入真实姓名" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="userType" label="用户类型">
                <Select placeholder="请选择用户类型" allowClear>
                  <Option value={UserType.CASE_SOURCE_CLIENT}>案源端客户</Option>
                  <Option value={UserType.MEDIATION_CENTER}>调解中心</Option>
                  <Option value={UserType.PLATFORM_OPERATOR}>平台运营方</Option>
                  <Option value={UserType.COURT}>法院</Option>
                  <Option value={UserType.DEBTOR}>债务人</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态" allowClear>
                  <Option value={UserStatus.ACTIVE}>启用</Option>
                  <Option value={UserStatus.INACTIVE}>禁用</Option>
                </Select>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出数据
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 用户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={listState.users}
          rowKey="id"
          loading={listState.loading}
          pagination={{
            current: listState.current,
            pageSize: listState.pageSize,
            total: listState.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新增/编辑用户弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, max: 20, message: '用户名长度为3-20个字符' }
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="realName"
                label="真实姓名"
                rules={[
                  { required: true, message: '请输入真实姓名' },
                  { max: 50, message: '真实姓名最多50个字符' }
                ]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { type: 'email', message: '请输入正确的邮箱格式' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="userType"
                label="用户类型"
                rules={[{ required: true, message: '请选择用户类型' }]}
              >
                <Select placeholder="请选择用户类型">
                  <Option value={UserType.CASE_SOURCE_CLIENT}>案源端客户</Option>
                  <Option value={UserType.MEDIATION_CENTER}>调解中心</Option>
                  <Option value={UserType.PLATFORM_OPERATOR}>平台运营方</Option>
                  <Option value={UserType.COURT}>法院</Option>
                  <Option value={UserType.DEBTOR}>债务人</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value={UserStatus.ACTIVE}>启用</Option>
                  <Option value={UserStatus.INACTIVE}>禁用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          {!editingUser && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, max: 20, message: '密码长度为6-20个字符' }
                  ]}
                >
                  <Input.Password placeholder="请输入密码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'))
                      }
                    })
                  ]}
                >
                  <Input.Password placeholder="请确认密码" />
                </Form.Item>
              </Col>
            </Row>
          )}
          
          <Form.Item
            name="remarks"
            label="备注"
          >
            <Input.TextArea
              placeholder="请输入备注信息"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserList