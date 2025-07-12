import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Row,
  Col,
  Select,
  InputNumber,
  Button,
  Table,
  Space,
  message,
  Divider,
  Typography,
  Alert,
  Descriptions,
  Tag,
  Modal,
  Tooltip,
  Steps
} from 'antd'
import {
  CalculatorOutlined,
  SaveOutlined,
  ClearOutlined,
  InfoCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { FeeType, SettlementRecord, FeeDetail } from '@/types'
import { settlementService, caseService } from '@/services'
import { formatCurrency } from '@/utils'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { Title, Paragraph } = Typography
const { Step } = Steps

interface CalculationState {
  caseId?: number
  caseInfo?: any
  settlementType: string
  baseAmount: number
  selectedFeeTypes: FeeType[]
  feeDetails: FeeDetail[]
  totalAmount: number
  calculation?: {
    baseAmount: number
    totalFees: number
    breakdown: Array<{
      feeType: FeeType
      amount: number
      rate: number
      calculation: string
    }>
  }
  loading: boolean
}

interface FeeRule {
  id: number
  feeType: FeeType
  feeTypeName: string
  rate: number
  minAmount?: number
  maxAmount?: number
  formula: string
  description: string
  isActive: boolean
}

const SettlementCalculator: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [state, setState] = useState<CalculationState>({
    settlementType: 'mediation',
    baseAmount: 0,
    selectedFeeTypes: [],
    feeDetails: [],
    totalAmount: 0,
    loading: false
  })
  
  const [feeRules, setFeeRules] = useState<FeeRule[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [isRuleModalVisible, setIsRuleModalVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // 表格列定义
  const columns: ColumnsType<FeeDetail> = [
    {
      title: '费用类型',
      dataIndex: 'feeType',
      key: 'feeType',
      width: 120,
      render: (feeType: FeeType) => {
        const typeMap = {
          [FeeType.SERVICE_FEE]: '服务费',
          [FeeType.LITIGATION_FEE]: '诉讼费',
          [FeeType.EXECUTION_FEE]: '执行费',
          [FeeType.COMMISSION]: '佣金',
          [FeeType.OTHER]: '其他费用'
        }
        return (
          <Tag color="blue">
            {typeMap[feeType] || '未知'}
          </Tag>
        )
      }
    },
    {
      title: '费用说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '计算方式',
      dataIndex: 'calculationMethod',
      key: 'calculationMethod',
      width: 150,
      ellipsis: true
    },
    {
      title: '基准金额',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      width: 120,
      render: (amount: number) => amount ? formatCurrency(amount) : '-'
    },
    {
      title: '费率(%)',
      dataIndex: 'rate',
      key: 'rate',
      width: 100,
      render: (rate: number) => rate ? `${rate}%` : '-'
    },
    {
      title: '计算金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {formatCurrency(amount)}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record, index) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditFeeDetail(index)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleRemoveFeeDetail(index)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  // 获取案件列表
  const fetchCases = async () => {
    try {
      const response = await caseService.getCaseList({
        page: 1,
        size: 100,
        status: 3 // 已分案状态
      })
      setCases(response.data.records)
    } catch (error) {
      message.error('获取案件列表失败')
    }
  }

  // 获取费用规则
  const fetchFeeRules = async (settlementType?: string) => {
    try {
      const response = await settlementService.getFeeRules(settlementType)
      setFeeRules(response.data)
    } catch (error) {
      message.error('获取费用规则失败')
    }
  }

  // 计算费用
  const handleCalculate = async () => {
    if (!state.caseId || !state.baseAmount || state.selectedFeeTypes.length === 0) {
      message.warning('请填写完整的计算参数')
      return
    }

    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await settlementService.calculateFees({
        caseId: state.caseId,
        settlementType: state.settlementType,
        baseAmount: state.baseAmount,
        feeTypes: state.selectedFeeTypes
      })

      setState(prev => ({
        ...prev,
        feeDetails: response.data.feeDetails,
        totalAmount: response.data.totalAmount,
        calculation: response.data.calculation,
        loading: false
      }))

      setCurrentStep(2)
      message.success('费用计算完成')
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }))
      message.error('费用计算失败')
    }
  }

  // 创建结算记录
  const handleCreateSettlement = async () => {
    if (state.feeDetails.length === 0) {
      message.warning('请先进行费用计算')
      return
    }

    try {
      const response = await settlementService.createSettlement({
        caseId: state.caseId!,
        settlementType: state.settlementType,
        feeDetails: state.feeDetails.map(({ id, ...detail }) => detail)
      })

      message.success('结算记录创建成功')
      navigate(`/settlement/detail/${response.data.id}`)
    } catch (error) {
      message.error('创建结算记录失败')
    }
  }

  // 重置计算
  const handleReset = () => {
    setState({
      settlementType: 'mediation',
      baseAmount: 0,
      selectedFeeTypes: [],
      feeDetails: [],
      totalAmount: 0,
      loading: false
    })
    form.resetFields()
    setCurrentStep(0)
  }

  // 编辑费用明细
  const handleEditFeeDetail = (index: number) => {
    // 这里可以实现费用明细的编辑功能
    message.info('费用明细编辑功能开发中...')
  }

  // 删除费用明细
  const handleRemoveFeeDetail = (index: number) => {
    const newFeeDetails = [...state.feeDetails]
    newFeeDetails.splice(index, 1)
    
    const newTotalAmount = newFeeDetails.reduce((sum, item) => sum + item.amount, 0)
    
    setState(prev => ({
      ...prev,
      feeDetails: newFeeDetails,
      totalAmount: newTotalAmount
    }))
  }

  // 添加自定义费用
  const handleAddCustomFee = () => {
    // 这里可以实现添加自定义费用的功能
    message.info('添加自定义费用功能开发中...')
  }

  // 案件选择变化
  const handleCaseChange = async (caseId: number) => {
    try {
      const response = await caseService.getCaseById(caseId)
      setState(prev => ({
        ...prev,
        caseId,
        caseInfo: response.data,
        baseAmount: response.data.debtAmount || 0
      }))
      
      form.setFieldsValue({
        baseAmount: response.data.debtAmount || 0
      })
      
      setCurrentStep(1)
    } catch (error) {
      message.error('获取案件信息失败')
    }
  }

  // 结算类型变化
  const handleSettlementTypeChange = (value: string) => {
    setState(prev => ({ ...prev, settlementType: value }))
    fetchFeeRules(value)
  }

  useEffect(() => {
    fetchCases()
    fetchFeeRules()
  }, [])

  const steps = [
    {
      title: '选择案件',
      description: '选择需要结算的案件'
    },
    {
      title: '设置参数',
      description: '设置结算类型和基准金额'
    },
    {
      title: '计算结果',
      description: '查看费用计算结果'
    }
  ]

  return (
    <div>
      <Card title="费用计算器" extra={
        <Space>
          <Button 
            icon={<InfoCircleOutlined />}
            onClick={() => setIsRuleModalVisible(true)}
          >
            计费规则
          </Button>
          <Button 
            icon={<ClearOutlined />}
            onClick={handleReset}
          >
            重置
          </Button>
        </Space>
      }>
        {/* 步骤指示器 */}
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} description={item.description} />
          ))}
        </Steps>

        {/* 计算参数设置 */}
        <Card title="计算参数" style={{ marginBottom: 16 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCalculate}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="选择案件"
                  name="caseId"
                  rules={[{ required: true, message: '请选择案件' }]}
                >
                  <Select
                    placeholder="请选择案件"
                    showSearch
                    optionFilterProp="children"
                    onChange={handleCaseChange}
                  >
                    {cases.map(caseItem => (
                      <Option key={caseItem.id} value={caseItem.id}>
                        {caseItem.caseNumber} - {caseItem.borrowerName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="结算类型"
                  name="settlementType"
                  initialValue="mediation"
                  rules={[{ required: true, message: '请选择结算类型' }]}
                >
                  <Select onChange={handleSettlementTypeChange}>
                    <Option value="mediation">调解结算</Option>
                    <Option value="litigation">诉讼结算</Option>
                    <Option value="execution">执行结算</Option>
                    <Option value="service">服务费结算</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="基准金额"
                  name="baseAmount"
                  rules={[{ required: true, message: '请输入基准金额' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入基准金额"
                    min={0}
                    precision={2}
                    formatter={value => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value!.replace(/￥\s?|(,*)/g, '') as any}
                    onChange={(value) => setState(prev => ({ ...prev, baseAmount: value || 0 }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  label="费用类型"
                  name="feeTypes"
                  rules={[{ required: true, message: '请选择费用类型' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择费用类型"
                    onChange={(values) => setState(prev => ({ ...prev, selectedFeeTypes: values }))}
                  >
                    <Option value={FeeType.SERVICE_FEE}>服务费</Option>
                    <Option value={FeeType.LITIGATION_FEE}>诉讼费</Option>
                    <Option value={FeeType.EXECUTION_FEE}>执行费</Option>
                    <Option value={FeeType.COMMISSION}>佣金</Option>
                    <Option value={FeeType.OTHER}>其他费用</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label=" ">
                  <Space>
                    <Button
                      type="primary"
                      icon={<CalculatorOutlined />}
                      htmlType="submit"
                      loading={state.loading}
                    >
                      计算费用
                    </Button>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={handleAddCustomFee}
                    >
                      自定义费用
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 案件信息显示 */}
        {state.caseInfo && (
          <Card title="案件信息" style={{ marginBottom: 16 }}>
            <Descriptions column={3} size="small">
              <Descriptions.Item label="案件编号">{state.caseInfo.caseNumber}</Descriptions.Item>
              <Descriptions.Item label="借款人">{state.caseInfo.borrowerName}</Descriptions.Item>
              <Descriptions.Item label="债务金额">
                <span style={{ fontWeight: 'bold', color: '#f5222d' }}>
                  {formatCurrency(state.caseInfo.debtAmount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="委托客户">{state.caseInfo.clientName}</Descriptions.Item>
              <Descriptions.Item label="案件状态">
                <Tag color="blue">进行中</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{state.caseInfo.createTime}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 计算结果 */}
        {state.calculation && (
          <Card title="计算结果" style={{ marginBottom: 16 }}>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                      {formatCurrency(state.calculation.baseAmount)}
                    </Title>
                    <Paragraph style={{ margin: 0, color: '#666' }}>基准金额</Paragraph>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                      {formatCurrency(state.calculation.totalFees)}
                    </Title>
                    <Paragraph style={{ margin: 0, color: '#666' }}>总费用</Paragraph>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: '#faad14' }}>
                      {formatCurrency(state.totalAmount)}
                    </Title>
                    <Paragraph style={{ margin: 0, color: '#666' }}>结算总额</Paragraph>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
                      {state.calculation.breakdown.length}
                    </Title>
                    <Paragraph style={{ margin: 0, color: '#666' }}>费用项目</Paragraph>
                  </div>
                </Card>
              </Col>
            </Row>

            <Alert
              message="计算说明"
              description={
                <div>
                  <p>本次计算基于系统设定的费用规则，具体计算方式如下：</p>
                  {state.calculation.breakdown.map((item, index) => (
                    <p key={index}>
                      • {item.calculation}
                    </p>
                  ))}
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </Card>
        )}

        {/* 费用明细表格 */}
        {state.feeDetails.length > 0 && (
          <Card 
            title="费用明细" 
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleCreateSettlement}
                >
                  创建结算记录
                </Button>
                <Button
                  icon={<FileTextOutlined />}
                  onClick={() => message.info('导出功能开发中...')}
                >
                  导出明细
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={state.feeDetails}
              rowKey="id"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5}>
                      <strong>合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <strong style={{ color: '#f5222d' }}>
                        {formatCurrency(state.totalAmount)}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        )}
      </Card>

      {/* 计费规则弹窗 */}
      <Modal
        title="计费规则说明"
        open={isRuleModalVisible}
        onCancel={() => setIsRuleModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={feeRules}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            {
              title: '费用类型',
              dataIndex: 'feeTypeName',
              key: 'feeTypeName'
            },
            {
              title: '费率',
              dataIndex: 'rate',
              key: 'rate',
              render: (rate: number) => `${rate}%`
            },
            {
              title: '最小金额',
              dataIndex: 'minAmount',
              key: 'minAmount',
              render: (amount: number) => amount ? formatCurrency(amount) : '-'
            },
            {
              title: '最大金额',
              dataIndex: 'maxAmount',
              key: 'maxAmount',
              render: (amount: number) => amount ? formatCurrency(amount) : '-'
            },
            {
              title: '计算公式',
              dataIndex: 'formula',
              key: 'formula',
              ellipsis: true
            },
            {
              title: '状态',
              dataIndex: 'isActive',
              key: 'isActive',
              render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                  {isActive ? '启用' : '禁用'}
                </Tag>
              )
            }
          ]}
        />
      </Modal>
    </div>
  )
}

export default SettlementCalculator