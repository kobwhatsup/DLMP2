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
  Tooltip,
  InputNumber,
  Switch,
  Divider
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { AssignmentRule, RuleCondition, RuleAction } from '@/types'
import { assignmentService } from '@/services'
import { formatDateTime } from '@/utils'

const { Option } = Select
const { TextArea } = Input

interface RuleListState {
  rules: AssignmentRule[]
  loading: boolean
  total: number
  current: number
  pageSize: number
}

const AssignmentRules: React.FC = () => {
  const [listState, setListState] = useState<RuleListState>({
    rules: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10
  })
  
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null)
  const [conditions, setConditions] = useState<RuleCondition[]>([{ field: '', operator: '', value: '', logic: 'AND' }])
  const [actions, setActions] = useState<RuleAction[]>([{ type: '', target: '', weight: 1 }])
  const [form] = Form.useForm()

  // 条件字段选项
  const conditionFields = [
    { label: '债务金额', value: 'debtAmount' },
    { label: '逾期天数', value: 'overdueDays' },
    { label: '债务人年龄', value: 'debtorAge' },
    { label: '债务人性别', value: 'debtorGender' },
    { label: '债务人地区', value: 'debtorRegion' },
    { label: '案件类型', value: 'caseType' },
    { label: '委托机构', value: 'clientId' },
    { label: '创建时间', value: 'createTime' }
  ]

  // 操作符选项
  const operators = [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
    { label: '大于', value: 'gt' },
    { label: '大于等于', value: 'gte' },
    { label: '小于', value: 'lt' },
    { label: '小于等于', value: 'lte' },
    { label: '包含', value: 'contains' },
    { label: '不包含', value: 'not_contains' },
    { label: '在范围内', value: 'in' },
    { label: '不在范围内', value: 'not_in' }
  ]

  // 动作类型选项
  const actionTypes = [
    { label: '分配到调解中心', value: 'assign_mediation_center' },
    { label: '分配到调解员', value: 'assign_mediator' },
    { label: '设置优先级', value: 'set_priority' },
    { label: '添加标签', value: 'add_tag' },
    { label: '发送通知', value: 'send_notification' }
  ]

  // 表格列定义
  const columns: ColumnsType<AssignmentRule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true
    },
    {
      title: '规则描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: number) => (
        <Tag color={priority <= 3 ? 'red' : priority <= 6 ? 'orange' : 'green'}>
          {priority}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '执行次数',
      dataIndex: 'executeCount',
      key: 'executeCount',
      width: 100,
      render: (count: number) => count || 0
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      width: 100,
      render: (rate: number) => `${(rate * 100).toFixed(1)}%`
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
          <Tooltip title="复制">
            <Button
              type="link"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => handleCopy(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? '禁用' : '启用'}>
            <Button
              type="link"
              icon={record.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              size="small"
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除该规则吗？"
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

  // 获取规则列表
  const fetchRules = async () => {
    setListState(prev => ({ ...prev, loading: true }))
    try {
      const response = await assignmentService.getRuleList({
        page: listState.current,
        size: listState.pageSize
      })
      
      setListState(prev => ({
        ...prev,
        rules: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取规则列表失败')
      setListState(prev => ({ ...prev, loading: false }))
    }
  }

  // 新增规则
  const handleAdd = () => {
    setEditingRule(null)
    setConditions([{ field: '', operator: '', value: '', logic: 'AND' }])
    setActions([{ type: '', target: '', weight: 1 }])
    setIsModalVisible(true)
    form.resetFields()
  }

  // 编辑规则
  const handleEdit = (rule: AssignmentRule) => {
    setEditingRule(rule)
    setConditions(rule.conditions || [{ field: '', operator: '', value: '', logic: 'AND' }])
    setActions(rule.actions || [{ type: '', target: '', weight: 1 }])
    setIsModalVisible(true)
    form.setFieldsValue(rule)
  }

  // 复制规则
  const handleCopy = (rule: AssignmentRule) => {
    const newRule = {
      ...rule,
      name: `${rule.name}_复制`,
      status: 'inactive'
    }
    setEditingRule(null)
    setConditions(rule.conditions || [{ field: '', operator: '', value: '', logic: 'AND' }])
    setActions(rule.actions || [{ type: '', target: '', weight: 1 }])
    setIsModalVisible(true)
    form.setFieldsValue(newRule)
  }

  // 切换规则状态
  const handleToggleStatus = async (rule: AssignmentRule) => {
    try {
      const newStatus = rule.status === 'active' ? 'inactive' : 'active'
      await assignmentService.updateRuleStatus(rule.id, newStatus)
      message.success(`规则已${newStatus === 'active' ? '启用' : '禁用'}`)
      fetchRules()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 删除规则
  const handleDelete = async (id: number) => {
    try {
      await assignmentService.deleteRule(id)
      message.success('删除成功')
      fetchRules()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 保存规则
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      const ruleData = {
        ...values,
        conditions,
        actions
      }
      
      if (editingRule) {
        await assignmentService.updateRule(editingRule.id, ruleData)
        message.success('更新成功')
      } else {
        await assignmentService.createRule(ruleData)
        message.success('创建成功')
      }
      
      setIsModalVisible(false)
      fetchRules()
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请检查表单填写')
      } else {
        message.error(editingRule ? '更新失败' : '创建失败')
      }
    }
  }

  // 添加条件
  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: '', value: '', logic: 'AND' }])
  }

  // 删除条件
  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index)
    setConditions(newConditions)
  }

  // 更新条件
  const updateCondition = (index: number, field: keyof RuleCondition, value: any) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    setConditions(newConditions)
  }

  // 添加动作
  const addAction = () => {
    setActions([...actions, { type: '', target: '', weight: 1 }])
  }

  // 删除动作
  const removeAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index)
    setActions(newActions)
  }

  // 更新动作
  const updateAction = (index: number, field: keyof RuleAction, value: any) => {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], [field]: value }
    setActions(newActions)
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
    fetchRules()
  }, [listState.current, listState.pageSize])

  return (
    <div>
      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增规则
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchRules}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 规则表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={listState.rules}
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

      {/* 新增/编辑规则弹窗 */}
      <Modal
        title={editingRule ? '编辑规则' : '新增规则'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={800}
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
                name="name"
                label="规则名称"
                rules={[{ required: true, message: '请输入规则名称' }]}
              >
                <Input placeholder="请输入规则名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请输入优先级' }]}
              >
                <InputNumber min={1} max={10} placeholder="1-10" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="status"
                label="状态"
                valuePropName="checked"
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="规则描述"
          >
            <TextArea
              placeholder="请输入规则描述"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Divider>条件设置</Divider>
          
          {conditions.map((condition, index) => (
            <Row key={index} gutter={16} style={{ marginBottom: 16 }}>
              {index > 0 && (
                <Col span={2}>
                  <Select
                    value={condition.logic}
                    onChange={(value) => updateCondition(index, 'logic', value)}
                    style={{ width: '100%' }}
                  >
                    <Option value="AND">且</Option>
                    <Option value="OR">或</Option>
                  </Select>
                </Col>
              )}
              <Col span={index === 0 ? 6 : 5}>
                <Select
                  placeholder="选择字段"
                  value={condition.field}
                  onChange={(value) => updateCondition(index, 'field', value)}
                  style={{ width: '100%' }}
                >
                  {conditionFields.map(field => (
                    <Option key={field.value} value={field.value}>{field.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={index === 0 ? 4 : 3}>
                <Select
                  placeholder="操作符"
                  value={condition.operator}
                  onChange={(value) => updateCondition(index, 'operator', value)}
                  style={{ width: '100%' }}
                >
                  {operators.map(op => (
                    <Option key={op.value} value={op.value}>{op.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={index === 0 ? 6 : 5}>
                <Input
                  placeholder="值"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                />
              </Col>
              <Col span={index === 0 ? 8 : 9}>
                <Space>
                  {index === conditions.length - 1 && (
                    <Button type="dashed" onClick={addCondition}>
                      添加条件
                    </Button>
                  )}
                  {conditions.length > 1 && (
                    <Button danger onClick={() => removeCondition(index)}>
                      删除
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          ))}

          <Divider>动作设置</Divider>
          
          {actions.map((action, index) => (
            <Row key={index} gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Select
                  placeholder="动作类型"
                  value={action.type}
                  onChange={(value) => updateAction(index, 'type', value)}
                  style={{ width: '100%' }}
                >
                  {actionTypes.map(type => (
                    <Option key={type.value} value={type.value}>{type.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Input
                  placeholder="目标"
                  value={action.target}
                  onChange={(e) => updateAction(index, 'target', e.target.value)}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="权重"
                  min={1}
                  max={10}
                  value={action.weight}
                  onChange={(value) => updateAction(index, 'weight', value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}>
                <Space>
                  {index === actions.length - 1 && (
                    <Button type="dashed" onClick={addAction}>
                      添加动作
                    </Button>
                  )}
                  {actions.length > 1 && (
                    <Button danger onClick={() => removeAction(index)}>
                      删除
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          ))}
        </Form>
      </Modal>
    </div>
  )
}

export default AssignmentRules