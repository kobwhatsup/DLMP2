import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  message,
  Form,
  Input,
  Card,
  Tree,
  Row,
  Col,
  Popconfirm,
  Tooltip,
  Divider
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'
import { Role, Permission } from '@/types'
import { userService } from '@/services'
import { formatDateTime } from '@/utils'

interface RoleListState {
  roles: Role[]
  loading: boolean
  total: number
  current: number
  pageSize: number
}

const RoleList: React.FC = () => {
  const [listState, setListState] = useState<RoleListState>({
    roles: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10
  })
  
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [currentRoleId, setCurrentRoleId] = useState<number | null>(null)
  const [permissionTree, setPermissionTree] = useState<DataNode[]>([])
  const [checkedPermissions, setCheckedPermissions] = useState<string[]>([])
  const [form] = Form.useForm()

  // 权限树数据
  const buildPermissionTree = (permissions: Permission[]): DataNode[] => {
    const permissionMap = new Map<string, Permission[]>()
    
    // 按模块分组
    permissions.forEach(permission => {
      const module = permission.module || '其他'
      if (!permissionMap.has(module)) {
        permissionMap.set(module, [])
      }
      permissionMap.get(module)!.push(permission)
    })
    
    // 构建树结构
    return Array.from(permissionMap.entries()).map(([module, perms]) => ({
      title: module,
      key: module,
      children: perms.map(perm => ({
        title: perm.name,
        key: perm.id.toString(),
        isLeaf: true
      }))
    }))
  }

  // 表格列定义
  const columns: ColumnsType<Role> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '角色编码',
      dataIndex: 'code',
      key: 'code',
      width: 150
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      key: 'permissionCount',
      width: 100,
      render: (permissions: Permission[]) => permissions?.length || 0
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => formatDateTime(time)
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
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
          <Tooltip title="权限设置">
            <Button
              type="link"
              icon={<SettingOutlined />}
              size="small"
              onClick={() => handlePermissionSetting(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除该角色吗？"
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

  // 获取角色列表
  const fetchRoles = async () => {
    setListState(prev => ({ ...prev, loading: true }))
    try {
      const response = await userService.getRoleList({
        page: listState.current,
        size: listState.pageSize
      })
      
      setListState(prev => ({
        ...prev,
        roles: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取角色列表失败')
      setListState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取权限列表
  const fetchPermissions = async () => {
    try {
      const response = await userService.getPermissionList()
      const tree = buildPermissionTree(response.data)
      setPermissionTree(tree)
    } catch (error) {
      message.error('获取权限列表失败')
    }
  }

  // 获取角色权限
  const fetchRolePermissions = async (roleId: number) => {
    try {
      const response = await userService.getRolePermissions(roleId)
      const permissionIds = response.data.map((p: Permission) => p.id.toString())
      setCheckedPermissions(permissionIds)
    } catch (error) {
      message.error('获取角色权限失败')
    }
  }

  // 新增角色
  const handleAdd = () => {
    setEditingRole(null)
    setIsModalVisible(true)
    form.resetFields()
  }

  // 编辑角色
  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setIsModalVisible(true)
    form.setFieldsValue(role)
  }

  // 权限设置
  const handlePermissionSetting = async (role: Role) => {
    setCurrentRoleId(role.id)
    setIsPermissionModalVisible(true)
    await fetchPermissions()
    await fetchRolePermissions(role.id)
  }

  // 删除角色
  const handleDelete = async (id: number) => {
    try {
      await userService.deleteRole(id)
      message.success('删除成功')
      fetchRoles()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 保存角色
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingRole) {
        await userService.updateRole(editingRole.id, values)
        message.success('更新成功')
      } else {
        await userService.createRole(values)
        message.success('创建成功')
      }
      
      setIsModalVisible(false)
      fetchRoles()
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请检查表单填写')
      } else {
        message.error(editingRole ? '更新失败' : '创建失败')
      }
    }
  }

  // 保存权限设置
  const handleSavePermissions = async () => {
    if (!currentRoleId) return
    
    try {
      const permissionIds = checkedPermissions.map(id => parseInt(id))
      await userService.updateRolePermissions(currentRoleId, permissionIds)
      message.success('权限设置成功')
      setIsPermissionModalVisible(false)
      fetchRoles()
    } catch (error) {
      message.error('权限设置失败')
    }
  }

  // 权限树选择变化
  const handlePermissionCheck = (checkedKeys: any) => {
    setCheckedPermissions(checkedKeys)
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
    fetchRoles()
  }, [listState.current, listState.pageSize])

  return (
    <div>
      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增角色
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchRoles}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 角色表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={listState.roles}
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
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 新增/编辑角色弹窗 */}
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={500}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[
              { required: true, message: '请输入角色名称' },
              { max: 50, message: '角色名称最多50个字符' }
            ]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          
          <Form.Item
            name="code"
            label="角色编码"
            rules={[
              { required: true, message: '请输入角色编码' },
              { pattern: /^[A-Z_]+$/, message: '角色编码只能包含大写字母和下划线' },
              { max: 50, message: '角色编码最多50个字符' }
            ]}
          >
            <Input placeholder="请输入角色编码" disabled={!!editingRole} />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[
              { max: 200, message: '描述最多200个字符' }
            ]}
          >
            <Input.TextArea
              placeholder="请输入角色描述"
              rows={3}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限设置弹窗 */}
      <Modal
        title="权限设置"
        open={isPermissionModalVisible}
        onOk={handleSavePermissions}
        onCancel={() => setIsPermissionModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          <Tree
            checkable
            checkedKeys={checkedPermissions}
            onCheck={handlePermissionCheck}
            treeData={permissionTree}
            defaultExpandAll
          />
        </div>
      </Modal>
    </div>
  )
}

export default RoleList