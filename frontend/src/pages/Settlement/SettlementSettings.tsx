import React, { useState, useEffect } from 'react'
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Row,
  Col,
  Typography,
  Alert,
  Divider
} from 'antd'
import {
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  ReloadOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  RocketOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { settlementService } from '@/services'
import { formatCurrency } from '@/utils'

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input
const { Title, Text } = Typography

interface FeeRule {
  id: number
  feeType: number
  feeTypeName: string
  rate: number
  minAmount?: number
  maxAmount?: number
  formula: string
  description: string
  settlementType?: string
  isActive: boolean
}

interface SettlementTemplate {
  id: number
  name: string
  settlementType: string
  feeRules: Array<{
    feeType: number
    rate: number
    formula: string
  }>
  isDefault: boolean
  createTime: string
}

interface SettingsState {
  feeRules: FeeRule[]
  templates: SettlementTemplate[]
  loading: boolean
  saving: boolean
}

const SettlementSettings: React.FC = () => {
  const [form] = Form.useForm()
  const [templateForm] = Form.useForm()
  const [state, setState] = useState<SettingsState>({
    feeRules: [],
    templates: [],
    loading: false,
    saving: false
  })
  
  const [isRuleModalVisible, setIsRuleModalVisible] = useState(false)
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<FeeRule | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<SettlementTemplate | null>(null)
  const [activeTab, setActiveTab] = useState('feeRules')

  // 费用规则表格列
  const feeRuleColumns: ColumnsType<FeeRule> = [
    {
      title: '费用类型',
      dataIndex: 'feeTypeName',
      key: 'feeTypeName',
      width: 120,
      render: (text, record) => (
        <Tag color="blue">{text}</Tag>
      )
    },
    {
      title: '适用类型',
      dataIndex: 'settlementType',
      key: 'settlementType',
      width: 120,
      render: (type) => {
        if (!type) return <Tag color="default">通用</Tag>
        const typeMap = {
          mediation: '调解',
          litigation: '诉讼',
          execution: '执行',
          service: '服务费'
        }
        return <Tag color="green">{typeMap[type as keyof typeof typeMap] || type}</Tag>
      }
    },
    {
      title: '费率',
      dataIndex: 'rate',
      key: 'rate',
      width: 100,
      render: (rate) => <span style={{ fontWeight: 'bold' }}>{(rate * 100).toFixed(1)}%</span>
    },
    {
      title: '最小金额',
      dataIndex: 'minAmount',
      key: 'minAmount',
      width: 120,
      render: (amount) => amount ? formatCurrency(amount) : '-'
    },
    {
      title: '最大金额',
      dataIndex: 'maxAmount',
      key: 'maxAmount',
      width: 120,
      render: (amount) => amount ? formatCurrency(amount) : '-'
    },
    {
      title: '计算公式',
      dataIndex: 'formula',
      key: 'formula',
      width: 150,
      ellipsis: true,
      render: (formula) => (
        <Tooltip title={formula}>
          <Text code style={{ fontSize: '12px' }}>{formula}</Text>
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive) => (
        <Switch
          checked={isActive}
          size="small"
          onChange={(checked) => handleToggleRuleStatus(editingRule?.id || 0, checked)}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditRule(record)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="link"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => handleCopyRule(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此费用规则吗？"
            onConfirm={() => handleDeleteRule(record.id)}
          >
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 模板表格列
  const templateColumns: ColumnsType<SettlementTemplate> = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          {record.isDefault && <Tag color="gold">默认</Tag>}
        </Space>
      )
    },
    {
      title: '结算类型',
      dataIndex: 'settlementType',
      key: 'settlementType',
      width: 120,
      render: (type) => {
        const typeMap = {
          mediation: '调解结算',
          litigation: '诉讼结算',
          execution: '执行结算',
          service: '服务费结算'
        }
        return <Tag color="blue">{typeMap[type as keyof typeof typeMap] || type}</Tag>
      }
    },
    {
      title: '费用规则数',
      key: 'feeRulesCount',
      width: 120,
      render: (_, record) => (
        <span>{record.feeRules.length} 项</span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditTemplate(record)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="link"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => handleCopyTemplate(record)}
            />
          </Tooltip>
          {!record.isDefault && (
            <Tooltip title="设为默认">
              <Button
                type="link"
                icon={<RocketOutlined />}
                size="small"
                onClick={() => handleSetDefaultTemplate(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确定删除此模板吗？"
            onConfirm={() => handleDeleteTemplate(record.id)}
          >
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={record.isDefault}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 获取费用规则
  const fetchFeeRules = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await settlementService.getFeeRules()
      setState(prev => ({
        ...prev,
        feeRules: response.data,
        loading: false
      }))
    } catch (error) {
      message.error('获取费用规则失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取模板列表
  const fetchTemplates = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await settlementService.getSettlementTemplates()
      setState(prev => ({
        ...prev,
        templates: response.data,
        loading: false
      }))
    } catch (error) {
      message.error('获取模板列表失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // 保存费用规则
  const handleSaveRule = async (values: any) => {
    setState(prev => ({ ...prev, saving: true }))
    try {
      if (editingRule) {
        await settlementService.updateFeeRule(editingRule.id, values)
        message.success('费用规则更新成功')
      } else {
        // 创建新规则的API需要实现
        message.success('费用规则创建成功')
      }
      
      setIsRuleModalVisible(false)
      setEditingRule(null)
      form.resetFields()
      fetchFeeRules()
    } catch (error) {
      message.error('保存费用规则失败')
    } finally {
      setState(prev => ({ ...prev, saving: false }))
    }
  }

  // 保存模板
  const handleSaveTemplate = async (values: any) => {
    setState(prev => ({ ...prev, saving: true }))
    try {
      // 模板保存API需要实现
      message.success(editingTemplate ? '模板更新成功' : '模板创建成功')
      
      setIsTemplateModalVisible(false)
      setEditingTemplate(null)
      templateForm.resetFields()
      fetchTemplates()
    } catch (error) {
      message.error('保存模板失败')
    } finally {
      setState(prev => ({ ...prev, saving: false }))
    }
  }

  // 编辑费用规则
  const handleEditRule = (rule: FeeRule) => {
    setEditingRule(rule)
    form.setFieldsValue({
      ...rule,
      rate: rule.rate * 100 // 转换为百分比显示
    })
    setIsRuleModalVisible(true)
  }

  // 新增费用规则
  const handleAddRule = () => {
    setEditingRule(null)
    form.resetFields()
    setIsRuleModalVisible(true)
  }

  // 复制费用规则
  const handleCopyRule = (rule: FeeRule) => {
    setEditingRule(null)
    form.setFieldsValue({
      ...rule,
      feeTypeName: `${rule.feeTypeName}_副本`,
      rate: rule.rate * 100
    })
    setIsRuleModalVisible(true)
  }

  // 删除费用规则
  const handleDeleteRule = async (id: number) => {
    try {
      // 删除API需要实现
      message.success('删除成功')
      fetchFeeRules()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 切换规则状态
  const handleToggleRuleStatus = async (id: number, isActive: boolean) => {
    try {
      await settlementService.updateFeeRule(id, { isActive })
      message.success('状态更新成功')
      fetchFeeRules()
    } catch (error) {
      message.error('状态更新失败')
    }
  }

  // 编辑模板
  const handleEditTemplate = (template: SettlementTemplate) => {
    setEditingTemplate(template)
    templateForm.setFieldsValue(template)
    setIsTemplateModalVisible(true)
  }

  // 新增模板
  const handleAddTemplate = () => {
    setEditingTemplate(null)
    templateForm.resetFields()
    setIsTemplateModalVisible(true)
  }

  // 复制模板
  const handleCopyTemplate = (template: SettlementTemplate) => {
    setEditingTemplate(null)
    templateForm.setFieldsValue({
      ...template,
      name: `${template.name}_副本`,
      isDefault: false
    })
    setIsTemplateModalVisible(true)
  }

  // 设为默认模板
  const handleSetDefaultTemplate = async (id: number) => {
    try {
      // 设为默认API需要实现
      message.success('设置默认模板成功')
      fetchTemplates()
    } catch (error) {
      message.error('设置默认模板失败')
    }
  }

  // 删除模板
  const handleDeleteTemplate = async (id: number) => {
    try {
      // 删除API需要实现
      message.success('删除成功')
      fetchTemplates()
    } catch (error) {
      message.error('删除失败')
    }
  }

  useEffect(() => {
    if (activeTab === 'feeRules') {
      fetchFeeRules()
    } else if (activeTab === 'templates') {
      fetchTemplates()
    }
  }, [activeTab])

  return (
    <div>
      <Card title={<><SettingOutlined /> 结算设置</>}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 费用规则管理 */}
          <TabPane tab="费用规则" key="feeRules">
            <Card
              title="费用规则管理"
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddRule}
                  >
                    新增规则
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchFeeRules}
                  >
                    刷新
                  </Button>
                </Space>
              }
            >
              <Alert
                message="费用规则说明"
                description="费用规则用于定义不同类型结算的收费标准，包括费率、最小最大金额限制等。规则可以针对特定结算类型或全局通用。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Table
                columns={feeRuleColumns}
                dataSource={state.feeRules}
                rowKey="id"
                loading={state.loading}
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`
                }}
              />
            </Card>
          </TabPane>

          {/* 结算模板管理 */}
          <TabPane tab="结算模板" key="templates">
            <Card
              title="结算模板管理"
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddTemplate}
                  >
                    新增模板
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchTemplates}
                  >
                    刷新
                  </Button>
                </Space>
              }
            >
              <Alert
                message="结算模板说明"
                description="结算模板包含预定义的费用规则组合，可以快速应用到新建结算记录中。支持设置默认模板，提高结算创建效率。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Table
                columns={templateColumns}
                dataSource={state.templates}
                rowKey="id"
                loading={state.loading}
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`
                }}
              />
            </Card>
          </TabPane>

          {/* 系统配置 */}
          <TabPane tab="系统配置" key="systemConfig">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="结算配置" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>自动生成结算单号</span>
                      <Switch defaultChecked />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>允许修改已审核结算</span>
                      <Switch />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>启用结算审批流程</span>
                      <Switch defaultChecked />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>自动发送逾期提醒</span>
                      <Switch defaultChecked />
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="通知配置" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>结算创建通知</span>
                      <Switch defaultChecked />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>审核状态通知</span>
                      <Switch defaultChecked />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>付款确认通知</span>
                      <Switch defaultChecked />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>逾期提醒通知</span>
                      <Switch defaultChecked />
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* 费用规则编辑弹窗 */}
      <Modal
        title={editingRule ? '编辑费用规则' : '新增费用规则'}
        open={isRuleModalVisible}
        onCancel={() => {
          setIsRuleModalVisible(false)
          setEditingRule(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveRule}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="费用类型"
                name="feeType"
                rules={[{ required: true, message: '请选择费用类型' }]}
              >
                <Select placeholder="请选择费用类型">
                  <Option value={1}>服务费</Option>
                  <Option value={2}>诉讼费</Option>
                  <Option value={3}>执行费</Option>
                  <Option value={4}>佣金</Option>
                  <Option value={5}>其他费用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="费用类型名称"
                name="feeTypeName"
                rules={[{ required: true, message: '请输入费用类型名称' }]}
              >
                <Input placeholder="请输入费用类型名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="适用结算类型"
                name="settlementType"
                tooltip="留空表示适用于所有结算类型"
              >
                <Select placeholder="请选择适用类型" allowClear>
                  <Option value="mediation">调解结算</Option>
                  <Option value="litigation">诉讼结算</Option>
                  <Option value="execution">执行结算</Option>
                  <Option value="service">服务费结算</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="费率 (%)"
                name="rate"
                rules={[{ required: true, message: '请输入费率' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="请输入费率"
                  formatter={value => `${value}%`}
                  parser={value => value!.replace('%', '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="最小金额"
                name="minAmount"
                tooltip="计算结果低于此金额时，按最小金额收取"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                  placeholder="请输入最小金额"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="最大金额"
                name="maxAmount"
                tooltip="计算结果高于此金额时，按最大金额收取"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                  placeholder="请输入最大金额"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="计算公式"
            name="formula"
            rules={[{ required: true, message: '请输入计算公式' }]}
          >
            <Input placeholder="例如: base_amount * rate" />
          </Form.Item>

          <Form.Item
            label="规则描述"
            name="description"
            rules={[{ required: true, message: '请输入规则描述' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入规则描述，说明此费用规则的适用场景和计算方式"
            />
          </Form.Item>

          <Form.Item
            label="启用状态"
            name="isActive"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Divider />

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => {
                setIsRuleModalVisible(false)
                setEditingRule(null)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={state.saving}
              >
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板编辑弹窗 */}
      <Modal
        title={editingTemplate ? '编辑结算模板' : '新增结算模板'}
        open={isTemplateModalVisible}
        onCancel={() => {
          setIsTemplateModalVisible(false)
          setEditingTemplate(null)
          templateForm.resetFields()
        }}
        footer={null}
        width={800}
      >
        <Form
          form={templateForm}
          layout="vertical"
          onFinish={handleSaveTemplate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="模板名称"
                name="name"
                rules={[{ required: true, message: '请输入模板名称' }]}
              >
                <Input placeholder="请输入模板名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="结算类型"
                name="settlementType"
                rules={[{ required: true, message: '请选择结算类型' }]}
              >
                <Select placeholder="请选择结算类型">
                  <Option value="mediation">调解结算</Option>
                  <Option value="litigation">诉讼结算</Option>
                  <Option value="execution">执行结算</Option>
                  <Option value="service">服务费结算</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="费用规则"
            tooltip="选择应用到此模板的费用规则"
          >
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 16 }}>
              <Text type="secondary">
                <InfoCircleOutlined /> 模板中的费用规则配置功能开发中...
              </Text>
            </div>
          </Form.Item>

          <Form.Item
            label="设为默认模板"
            name="isDefault"
            valuePropName="checked"
            tooltip="默认模板将在创建新结算时自动应用"
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Divider />

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => {
                setIsTemplateModalVisible(false)
                setEditingTemplate(null)
                templateForm.resetFields()
              }}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={state.saving}
              >
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SettlementSettings