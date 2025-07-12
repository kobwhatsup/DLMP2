import { useState, useEffect } from 'react'
import { Table, Button, Modal, message, Space } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { PageHeader, SearchForm, StatusTag } from '@/components'
import { userService } from '@/services'
import type { User, FormField } from '@/types'

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 搜索表单字段配置
  const searchFields: FormField[] = [
    {
      name: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '用户名、姓名、手机号',
    },
    {
      name: 'userType',
      label: '用户类型',
      type: 'select',
      options: [
        { label: '案源端客户', value: 1 },
        { label: '调解中心', value: 2 },
        { label: '平台运营方', value: 3 },
        { label: '法院用户', value: 4 },
      ],
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
  ]

  // 表格列配置
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '用户类型',
      dataIndex: 'userType',
      key: 'userType',
      render: (userType: number) => <StatusTag type='user' status={userType} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <StatusTag type='assignment' status={status} />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type='link'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type='link'
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // 加载用户数据
  const loadUsers = async (params?: any) => {
    try {
      setLoading(true)
      const response = await userService.getUsers({
        page: pagination.current,
        size: pagination.pageSize,
        ...params,
      })
      setUsers(response.records)
      setPagination({
        current: response.current,
        pageSize: response.size,
        total: response.total,
      })
    } catch (error) {
      message.error('加载用户数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadUsers()
  }, [])

  // 搜索处理
  const handleSearch = (values: any) => {
    setPagination({ ...pagination, current: 1 })
    loadUsers(values)
  }

  // 重置搜索
  const handleReset = () => {
    setPagination({ ...pagination, current: 1 })
    loadUsers()
  }

  // 刷新数据
  const handleRefresh = () => {
    loadUsers()
  }

  // 新增用户
  const handleAdd = () => {
    message.info('新增用户功能开发中')
  }

  // 编辑用户
  const handleEdit = (record: User) => {
    message.info(`编辑用户 ${record.username} 功能开发中`)
  }

  // 删除用户
  const handleDelete = (record: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 ${record.username} 吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await userService.deleteUser(record.id)
          message.success('删除成功')
          handleRefresh()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 表格分页处理
  const handleTableChange = (paginationParams: any) => {
    setPagination({
      ...pagination,
      current: paginationParams.current,
      pageSize: paginationParams.pageSize,
    })
    loadUsers()
  }

  return (
    <div>
      <PageHeader
        title='用户管理'
        subtitle='管理系统中的所有用户信息'
        onAdd={handleAdd}
        onRefresh={handleRefresh}
        addText='新增用户'
        showAdd
        showRefresh
      />

      <SearchForm
        fields={searchFields}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={loading}
      />

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        rowKey='id'
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />
    </div>
  )
}

export default UserManagement