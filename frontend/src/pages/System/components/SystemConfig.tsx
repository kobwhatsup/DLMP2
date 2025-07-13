import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  message,
  Modal,
  Row,
  Col,
  Tag,
  Typography,
  Alert,
  Collapse,
  Popconfirm,
  Tooltip
} from 'antd'
import {
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UndoOutlined,
  ExportOutlined,
  ImportOutlined,
  SearchOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { SystemConfig, SystemConfigGroup, SystemConfigType } from '@/types'
import { systemService } from '@/services'

const { Option } = Select
const { Text, Title } = Typography
const { Panel } = Collapse
const { Search } = Input

interface ConfigState {
  configs: SystemConfig[]
  groups: SystemConfigGroup[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  searchText: string
  selectedCategory: string
}

const SystemConfigComponent: React.FC = () => {
  const [form] = Form.useForm()
  const [state, setState] = useState<ConfigState>({
    configs: [],
    groups: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 20,
    searchText: '',
    selectedCategory: ''
  })

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null)
  const [batchEditConfigs, setBatchEditConfigs] = useState<{ id: number; configValue: string }[]>([])

  const configTypeOptions = [
    { label: '系统基础配置', value: SystemConfigType.SYSTEM },
    { label: '安全配置', value: SystemConfigType.SECURITY },
    { label: '通知配置', value: SystemConfigType.NOTIFICATION },
    { label: '存储配置', value: SystemConfigType.STORAGE },
    { label: '第三方集成', value: SystemConfigType.INTEGRATION },
    { label: '业务配置', value: SystemConfigType.BUSINESS }
  ]

  const valueTypeOptions = [
    { label: '字符串', value: 'string' },
    { label: '数字', value: 'number' },
    { label: '布尔值', value: 'boolean' },
    { label: 'JSON对象', value: 'json' },
    { label: '数组', value: 'array' }
  ]

  const columns: ColumnsType<SystemConfig> = [
    {
      title: '配置名称',
      dataIndex: 'configName',
      key: 'configName',
      width: 200,
      ellipsis: true,
      render: (name: string, record: SystemConfig) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.configKey}
          </Text>
        </div>
      )
    },
    {
      title: '配置值',
      dataIndex: 'configValue',
      key: 'configValue',
      width: 250,
      render: (value: string, record: SystemConfig) => {
        if (record.isEncrypted) {
          return <Text type="secondary">*** (已加密)</Text>
        }
        
        const displayValue = value.length > 50 ? `${value.substring(0, 50)}...` : value
        
        if (record.valueType === 'boolean') {
          return <Switch checked={value === 'true'} disabled />
        } else if (record.valueType === 'json') {
          return (
            <Tooltip title={value}>
              <Text code>{displayValue}</Text>
            </Tooltip>
          )
        } else {
          return (
            <Tooltip title={value}>
              <Text>{displayValue}</Text>
            </Tooltip>
          )
        }
      }
    },
    {
      title: '类型',
      dataIndex: 'valueType',
      key: 'valueType',
      width: 100,
      render: (type: string) => (
        <Tag color="blue">{valueTypeOptions.find(opt => opt.value === type)?.label}</Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color="green">{category}</Tag>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record: SystemConfig) => (
        <Space>
          <Tag color={record.isActive ? 'success' : 'default'}>
            {record.isActive ? '启用' : '禁用'}
          </Tag>
          {record.isPublic && <Tag color="orange">公开</Tag>}
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record: SystemConfig) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="重置为默认值">
            <Popconfirm
              title="确定要重置为默认值吗？"
              onConfirm={() => handleReset(record.id)}
            >
              <Button
                type="link"
                icon={<UndoOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个配置吗？"
              onConfirm={() => handleDelete(record.id)}
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

  const fetchConfigs = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await systemService.getSystemConfigs({
        page: state.current,
        size: state.pageSize,
        configKey: state.searchText,
        category: state.selectedCategory
      })
      
      setState(prev => ({
        ...prev,
        configs: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取配置列表失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await systemService.getSystemConfigGroups()
      setState(prev => ({ ...prev, groups: response.data }))
    } catch (error) {
      message.error('获取配置分组失败')
    }
  }

  const handleEdit = (config?: SystemConfig) => {
    setEditingConfig(config || null)
    if (config) {
      form.setFieldsValue(config)
    } else {
      form.resetFields()
    }
    setIsModalVisible(true)
  }

  const handleSave = async (values: any) => {
    try {
      if (editingConfig) {
        await systemService.updateSystemConfig(editingConfig.id, values)
        message.success('更新配置成功')
      } else {
        await systemService.createSystemConfig(values)
        message.success('创建配置成功')
      }
      setIsModalVisible(false)
      fetchConfigs()
    } catch (error) {
      message.error('保存配置失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await systemService.deleteSystemConfig(id)
      message.success('删除配置成功')
      fetchConfigs()
    } catch (error) {
      message.error('删除配置失败')
    }
  }

  const handleReset = async (id: number) => {
    try {
      await systemService.resetConfigToDefault(id)
      message.success('重置配置成功')
      fetchConfigs()
    } catch (error) {
      message.error('重置配置失败')
    }
  }

  const handleBatchSave = async () => {
    if (batchEditConfigs.length === 0) {
      message.warning('没有需要保存的修改')
      return
    }

    try {
      await systemService.batchUpdateConfigs(batchEditConfigs)
      message.success('批量保存成功')
      setBatchEditConfigs([])
      fetchConfigs()
    } catch (error) {
      message.error('批量保存失败')
    }
  }

  const handleExport = async () => {
    try {
      const response = await systemService.exportSystemConfig()
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = `系统配置_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('导出配置成功')
    } catch (error) {
      message.error('导出配置失败')
    }
  }

  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        await systemService.importSystemConfig(file)
        message.success('导入配置成功')
        fetchConfigs()
      } catch (error) {
        message.error('导入配置失败')
      }
    }
    reader.readAsText(file)
    return false
  }

  const handleTableChange = (pagination: any) => {
    setState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  useEffect(() => {
    fetchConfigs()
    fetchGroups()
  }, [state.current, state.pageSize, state.searchText, state.selectedCategory])

  return (
    <div>
      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col span={12}>
            <Space>
              <Search
                placeholder="搜索配置项"
                style={{ width: 300 }}
                onSearch={(value) => setState(prev => ({ ...prev, searchText: value, current: 1 }))}
                allowClear
              />
              <Select
                placeholder="选择分类"
                style={{ width: 150 }}
                allowClear
                onChange={(value) => setState(prev => ({ ...prev, selectedCategory: value || '', current: 1 }))}
              >
                {state.groups.map(group => (
                  <Option key={group.category} value={group.category}>
                    {group.categoryName}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              {batchEditConfigs.length > 0 && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleBatchSave}
                >
                  保存修改 ({batchEditConfigs.length})
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleEdit()}
              >
                新增配置
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                导出配置
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 批量编辑提示 */}
      {batchEditConfigs.length > 0 && (
        <Alert
          message={`已修改 ${batchEditConfigs.length} 项配置，记得保存修改`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button
              size="small"
              onClick={() => setBatchEditConfigs([])}
            >
              取消修改
            </Button>
          }
        />
      )}

      {/* 分组配置 */}
      <Collapse defaultActiveKey={state.groups.map(g => g.category)}>
        {state.groups.map(group => (
          <Panel
            key={group.category}
            header={
              <Space>
                <SettingOutlined />
                <Text strong>{group.categoryName}</Text>
                <Text type="secondary">({group.configs.length} 项)</Text>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={group.configs}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 1200 }}
            />
          </Panel>
        ))}
      </Collapse>

      {/* 配置编辑弹窗 */}
      <Modal
        title={editingConfig ? '编辑配置' : '新增配置'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="configKey"
                label="配置键"
                rules={[{ required: true, message: '请输入配置键' }]}
              >
                <Input placeholder="如: system.title" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="configName"
                label="配置名称"
                rules={[{ required: true, message: '请输入配置名称' }]}
              >
                <Input placeholder="如: 系统标题" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="configType"
                label="配置类型"
                rules={[{ required: true, message: '请选择配置类型' }]}
              >
                <Select placeholder="请选择">
                  {configTypeOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="valueType"
                label="值类型"
                rules={[{ required: true, message: '请选择值类型' }]}
              >
                <Select placeholder="请选择">
                  {valueTypeOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="configValue"
            label="配置值"
            rules={[{ required: true, message: '请输入配置值' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入配置值" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Input placeholder="如: 基础设置" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="defaultValue" label="默认值">
                <Input placeholder="留空使用当前值作为默认值" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="配置描述">
            <Input.TextArea rows={2} placeholder="请输入配置描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isActive" label="启用状态" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isPublic" label="公开配置" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isEncrypted" label="加密存储" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default SystemConfigComponent