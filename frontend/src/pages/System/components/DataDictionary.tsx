import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Form,
  Input,
  Switch,
  InputNumber,
  message,
  Modal,
  Row,
  Col,
  Tag,
  Typography,
  Tree,
  Popconfirm,
  Tooltip,
  Alert
} from 'antd'
import {
  DatabaseOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  BranchesOutlined,
  SyncOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'
import { DataDictionary, DictType } from '@/types'
import { systemService } from '@/services'

const { Text, Title } = Typography
const { Search } = Input

interface DictState {
  dictTypes: DictType[]
  dictItems: DataDictionary[]
  loading: boolean
  itemsLoading: boolean
  selectedTypeCode: string
  searchText: string
}

const DataDictionaryComponent: React.FC = () => {
  const [typeForm] = Form.useForm()
  const [itemForm] = Form.useForm()
  
  const [state, setState] = useState<DictState>({
    dictTypes: [],
    dictItems: [],
    loading: false,
    itemsLoading: false,
    selectedTypeCode: '',
    searchText: ''
  })

  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false)
  const [isItemModalVisible, setIsItemModalVisible] = useState(false)
  const [editingType, setEditingType] = useState<DictType | null>(null)
  const [editingItem, setEditingItem] = useState<DataDictionary | null>(null)

  // 字典类型表格列
  const typeColumns: ColumnsType<DictType> = [
    {
      title: '字典名称',
      dataIndex: 'typeName',
      key: 'typeName',
      width: 200
    },
    {
      title: '字典类型',
      dataIndex: 'typeCode',
      key: 'typeCode',
      width: 150,
      render: (code: string) => <Text code>{code}</Text>
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '系统内置',
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 100,
      render: (isSystem: boolean) => (
        isSystem ? <Tag color="blue">系统内置</Tag> : <Tag>自定义</Tag>
      )
    },
    {
      title: '字典项数量',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 100
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record: DictType) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleSelectType(record.typeCode)}
          >
            查看字典项
          </Button>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditType(record)}
            />
          </Tooltip>
          {!record.isSystem && (
            <Tooltip title="删除">
              <Popconfirm
                title="确定要删除这个字典类型吗？"
                description="删除后所有相关字典项也会被删除！"
                onConfirm={() => handleDeleteType(record.id)}
              >
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  // 字典项表格列
  const itemColumns: ColumnsType<DataDictionary> = [
    {
      title: '字典标签',
      dataIndex: 'dictName',
      key: 'dictName',
      width: 150
    },
    {
      title: '字典键值',
      dataIndex: 'dictCode',
      key: 'dictCode',
      width: 120,
      render: (code: string) => <Text code>{code}</Text>
    },
    {
      title: '字典值',
      dataIndex: 'dictValue',
      key: 'dictValue',
      width: 150
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record: DataDictionary) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditItem(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个字典项吗？"
              onConfirm={() => handleDeleteItem(record.id)}
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ]

  // 获取字典类型列表
  const fetchDictTypes = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await systemService.getDictTypes({
        page: 1,
        size: 100
      })
      setState(prev => ({
        ...prev,
        dictTypes: response.data.records,
        loading: false
      }))
    } catch (error) {
      message.error('获取字典类型失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取字典项列表
  const fetchDictItems = async (typeCode: string) => {
    setState(prev => ({ ...prev, itemsLoading: true }))
    try {
      const response = await systemService.getDictItems(typeCode)
      setState(prev => ({
        ...prev,
        dictItems: response.data,
        itemsLoading: false
      }))
    } catch (error) {
      message.error('获取字典项失败')
      setState(prev => ({ ...prev, itemsLoading: false }))
    }
  }

  // 选择字典类型
  const handleSelectType = (typeCode: string) => {
    setState(prev => ({ ...prev, selectedTypeCode: typeCode }))
    fetchDictItems(typeCode)
  }

  // 编辑字典类型
  const handleEditType = (type?: DictType) => {
    setEditingType(type || null)
    if (type) {
      typeForm.setFieldsValue(type)
    } else {
      typeForm.resetFields()
    }
    setIsTypeModalVisible(true)
  }

  // 保存字典类型
  const handleSaveType = async (values: any) => {
    try {
      if (editingType) {
        await systemService.updateDictType(editingType.id, values)
        message.success('更新字典类型成功')
      } else {
        await systemService.createDictType(values)
        message.success('创建字典类型成功')
      }
      setIsTypeModalVisible(false)
      fetchDictTypes()
    } catch (error) {
      message.error('保存字典类型失败')
    }
  }

  // 删除字典类型
  const handleDeleteType = async (id: number) => {
    try {
      await systemService.deleteDictType(id)
      message.success('删除字典类型成功')
      setState(prev => ({ ...prev, selectedTypeCode: '', dictItems: [] }))
      fetchDictTypes()
    } catch (error) {
      message.error('删除字典类型失败')
    }
  }

  // 编辑字典项
  const handleEditItem = (item?: DataDictionary) => {
    setEditingItem(item || null)
    if (item) {
      itemForm.setFieldsValue(item)
    } else {
      itemForm.resetFields()
      itemForm.setFieldsValue({ dictType: state.selectedTypeCode })
    }
    setIsItemModalVisible(true)
  }

  // 保存字典项
  const handleSaveItem = async (values: any) => {
    try {
      if (editingItem) {
        await systemService.updateDictItem(editingItem.id, values)
        message.success('更新字典项成功')
      } else {
        await systemService.createDictItem(values)
        message.success('创建字典项成功')
      }
      setIsItemModalVisible(false)
      fetchDictItems(state.selectedTypeCode)
    } catch (error) {
      message.error('保存字典项失败')
    }
  }

  // 删除字典项
  const handleDeleteItem = async (id: number) => {
    try {
      await systemService.deleteDictItem(id)
      message.success('删除字典项成功')
      fetchDictItems(state.selectedTypeCode)
    } catch (error) {
      message.error('删除字典项失败')
    }
  }

  // 刷新字典缓存
  const handleRefreshCache = async () => {
    try {
      await systemService.refreshDictCache()
      message.success('刷新字典缓存成功')
    } catch (error) {
      message.error('刷新字典缓存失败')
    }
  }

  // 构建树形数据
  const buildTreeData = (items: DataDictionary[]): DataNode[] => {
    const tree: DataNode[] = []
    const map: { [key: number]: DataNode } = {}
    
    items.forEach(item => {
      map[item.id] = {
        key: item.id,
        title: `${item.dictName} (${item.dictCode})`,
        children: []
      }
    })
    
    items.forEach(item => {
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children?.push(map[item.id])
      } else {
        tree.push(map[item.id])
      }
    })
    
    return tree
  }

  useEffect(() => {
    fetchDictTypes()
  }, [])

  return (
    <div>
      <Row gutter={16}>
        {/* 字典类型 */}
        <Col span={state.selectedTypeCode ? 12 : 24}>
          <Card 
            title={
              <Space>
                <DatabaseOutlined />
                字典类型管理
              </Space>
            }
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleEditType()}
                >
                  新增类型
                </Button>
                <Button
                  icon={<SyncOutlined />}
                  onClick={handleRefreshCache}
                  title="刷新字典缓存"
                >
                  刷新缓存
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchDictTypes}>
                  刷新
                </Button>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={typeColumns}
              dataSource={state.dictTypes}
              rowKey="id"
              loading={state.loading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              scroll={{ x: 800 }}
              rowSelection={{
                type: 'radio',
                selectedRowKeys: state.selectedTypeCode ? [state.selectedTypeCode] : [],
                onSelect: (record) => handleSelectType(record.typeCode)
              }}
            />
          </Card>
        </Col>

        {/* 字典项 */}
        {state.selectedTypeCode && (
          <Col span={12}>
            <Card 
              title={
                <Space>
                  <BranchesOutlined />
                  字典项管理
                  <Text type="secondary">({state.selectedTypeCode})</Text>
                </Space>
              }
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleEditItem()}
                  >
                    新增字典项
                  </Button>
                  <Button 
                    onClick={() => setState(prev => ({ ...prev, selectedTypeCode: '', dictItems: [] }))}
                  >
                    返回
                  </Button>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              {/* 树形视图切换 */}
              <div style={{ marginBottom: 16 }}>
                <Alert
                  message="字典项管理"
                  description="选择字典类型后可以管理其下的字典项。支持层级结构和排序。"
                  type="info"
                  showIcon
                />
              </div>

              <Table
                columns={itemColumns}
                dataSource={state.dictItems}
                rowKey="id"
                loading={state.itemsLoading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false
                }}
                scroll={{ x: 600 }}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* 字典类型编辑弹窗 */}
      <Modal
        title={editingType ? '编辑字典类型' : '新增字典类型'}
        open={isTypeModalVisible}
        onCancel={() => setIsTypeModalVisible(false)}
        onOk={() => typeForm.submit()}
        width={600}
        destroyOnClose
      >
        <Form form={typeForm} layout="vertical" onFinish={handleSaveType}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="typeCode"
                label="字典类型"
                rules={[
                  { required: true, message: '请输入字典类型' },
                  { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线，且以字母或下划线开头' }
                ]}
              >
                <Input placeholder="如: user_status" disabled={!!editingType} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="typeName"
                label="字典名称"
                rules={[{ required: true, message: '请输入字典名称' }]}
              >
                <Input placeholder="如: 用户状态" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="类型描述">
            <Input.TextArea rows={3} placeholder="请输入类型描述" />
          </Form.Item>

          <Form.Item name="isActive" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 字典项编辑弹窗 */}
      <Modal
        title={editingItem ? '编辑字典项' : '新增字典项'}
        open={isItemModalVisible}
        onCancel={() => setIsItemModalVisible(false)}
        onOk={() => itemForm.submit()}
        width={600}
        destroyOnClose
      >
        <Form form={itemForm} layout="vertical" onFinish={handleSaveItem}>
          <Form.Item name="dictType" hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dictCode"
                label="字典键值"
                rules={[{ required: true, message: '请输入字典键值' }]}
              >
                <Input placeholder="如: 1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dictName"
                label="字典标签"
                rules={[{ required: true, message: '请输入字典标签' }]}
              >
                <Input placeholder="如: 启用" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dictValue"
                label="字典值"
                rules={[{ required: true, message: '请输入字典值' }]}
              >
                <Input placeholder="如: active" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sortOrder"
                label="排序"
                rules={[{ type: 'number', min: 0 }]}
                initialValue={0}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="parentId" label="上级字典项">
            <Select placeholder="选择上级字典项（可选）" allowClear>
              {state.dictItems
                .filter(item => !editingItem || item.id !== editingItem.id)
                .map(item => (
                  <Option key={item.id} value={item.id}>
                    {item.dictName} ({item.dictCode})
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="字典描述">
            <Input.TextArea rows={2} placeholder="请输入字典描述" />
          </Form.Item>

          <Form.Item name="isActive" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DataDictionaryComponent