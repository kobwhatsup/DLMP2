import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Select,
  Button,
  Space,
  message,
  Row,
  Col,
  Table,
  InputNumber,
  DatePicker,
  Input,
  Steps,
  Alert,
  Descriptions
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CalculatorOutlined,
  CheckOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { settlementService, caseService } from '@/services'
import { formatCurrency } from '@/utils'
import { FeeType } from '@/types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { Step } = Steps

interface SelectedCase {
  id: number
  caseNumber: string
  borrowerName: string
  clientName: string
  debtAmount: number
}

interface FeeDetail {
  feeType: FeeType
  feeTypeName: string
  description: string
  baseAmount: number
  rate: number
  amount: number
  calculationMethod: string
  formula: string
}

const SettlementCreate: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<SelectedCase | null>(null)
  const [feeDetails, setFeeDetails] = useState<FeeDetail[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

  // 费用明细表格列
  const feeDetailColumns = [
    {
      title: '费用类型',
      dataIndex: 'feeTypeName',
      key: 'feeTypeName',
      width: 120
    },
    {
      title: '费用说明',
      dataIndex: 'description',
      key: 'description',
      width: 200
    },
    {
      title: '基准金额',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      width: 120,
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: '费率',
      dataIndex: 'rate',
      key: 'rate',
      width: 80,
      render: (rate: number) => `${(rate * 100).toFixed(1)}%`
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
      setCases(response.records)
    } catch (error) {
      message.error('获取案件列表失败')
    }
  }

  // 案件选择变化
  const handleCaseChange = async (caseId: number) => {
    try {
      const response = await caseService.getCaseById(caseId)
      const caseData = response
      
      setSelectedCase({
        id: caseData.id,
        caseNumber: caseData.caseNo,
        borrowerName: caseData.debtorName,
        clientName: caseData.clientName,
        debtAmount: caseData.overdueTotalAmount
      })
      
      form.setFieldsValue({
        baseAmount: caseData.overdueTotalAmount
      })
    } catch (error) {
      message.error('获取案件信息失败')
    }
  }

  // 费用计算
  const handleCalculateFees = async () => {
    const values = await form.validateFields(['settlementType', 'baseAmount', 'feeTypes'])
    
    if (!selectedCase) {
      message.warning('请先选择案件')
      return
    }

    setLoading(true)
    try {
      const response = await settlementService.calculateFees({
        caseId: selectedCase.id,
        settlementType: values.settlementType,
        baseAmount: values.baseAmount,
        feeTypes: values.feeTypes
      })

      setFeeDetails(response.feeDetails)
      setTotalAmount(response.totalAmount)
      setCurrentStep(2)
      message.success('费用计算完成')
    } catch (error) {
      message.error('费用计算失败')
    } finally {
      setLoading(false)
    }
  }

  // 创建结算记录
  const handleCreateSettlement = async () => {
    const values = await form.validateFields()
    
    if (!selectedCase || feeDetails.length === 0) {
      message.warning('请先完成费用计算')
      return
    }

    setCreating(true)
    try {
      const response = await settlementService.createSettlement({
        caseId: selectedCase.id,
        settlementType: values.settlementType,
        feeDetails: feeDetails.map(({ feeType, feeTypeName, description, baseAmount, rate, amount, calculationMethod, formula }) => ({
          feeType,
          feeTypeName,
          description,
          baseAmount,
          rate,
          amount,
          calculationMethod,
          formula
        })),
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
        description: values.description
      })

      message.success('结算记录创建成功')
      navigate(`/settlement/detail/${response.id}`)
    } catch (error) {
      message.error('创建结算记录失败')
    } finally {
      setCreating(false)
    }
  }

  // 返回列表
  const handleBack = () => {
    navigate('/settlement/list')
  }

  // 上一步
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  // 下一步
  const handleNextStep = async () => {
    if (currentStep === 0) {
      const values = await form.validateFields(['caseId', 'settlementType'])
      if (!selectedCase) {
        message.warning('请选择案件')
        return
      }
      setCurrentStep(1)
    } else if (currentStep === 1) {
      await handleCalculateFees()
    }
  }

  useEffect(() => {
    fetchCases()
  }, [])

  const steps = [
    {
      title: '选择案件',
      description: '选择需要创建结算的案件'
    },
    {
      title: '设置参数',
      description: '设置结算类型和计算参数'
    },
    {
      title: '确认结算',
      description: '确认费用明细并创建结算记录'
    }
  ]

  return (
    <div>
      <Card
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
            >
              返回
            </Button>
            新建结算记录
          </Space>
        }
      >
        {/* 步骤指示器 */}
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} description={item.description} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            settlementType: 'mediation',
            dueDate: dayjs().add(30, 'day')
          }}
        >
          {/* 第一步：选择案件 */}
          {currentStep === 0 && (
            <Card title="选择案件信息" size="small">
              <Row gutter={16}>
                <Col span={12}>
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
                          {caseItem.caseNo} - {caseItem.debtorName}
                        </Option>
                      ))}
                    </Select>
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

              {selectedCase && (
                <Alert
                  message="案件信息"
                  description={
                    <Descriptions column={2} size="small">
                      <Descriptions.Item label="案件编号">{selectedCase.caseNumber}</Descriptions.Item>
                      <Descriptions.Item label="借款人">{selectedCase.borrowerName}</Descriptions.Item>
                      <Descriptions.Item label="委托客户">{selectedCase.clientName}</Descriptions.Item>
                      <Descriptions.Item label="债务金额">
                        <span style={{ fontWeight: 'bold', color: '#f5222d' }}>
                          {formatCurrency(selectedCase.debtAmount)}
                        </span>
                      </Descriptions.Item>
                    </Descriptions>
                  }
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          )}

          {/* 第二步：设置参数 */}
          {currentStep === 1 && (
            <Card title="设置计算参数" size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="基准金额"
                    name="baseAmount"
                    rules={[{ required: true, message: '请输入基准金额' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={1000}
                      placeholder="请输入基准金额"
                      formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value!.replace(/¥\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    label="费用类型"
                    name="feeTypes"
                    rules={[{ required: true, message: '请选择费用类型' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="请选择费用类型"
                    >
                      <Option value={FeeType.SERVICE_FEE}>服务费</Option>
                      <Option value={FeeType.LITIGATION_FEE}>诉讼费</Option>
                      <Option value={FeeType.EXECUTION_FEE}>执行费</Option>
                      <Option value={FeeType.COMMISSION}>佣金</Option>
                      <Option value={FeeType.OTHER}>其他费用</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Alert
                message="计算说明"
                description="系统将根据选择的费用类型和基准金额，自动计算各项费用。计算结果可在下一步中查看和确认。"
                type="info"
                showIcon
              />
            </Card>
          )}

          {/* 第三步：确认结算 */}
          {currentStep === 2 && (
            <div>
              <Card title="费用计算结果" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0f2f5', borderRadius: '6px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                        {formatCurrency(form.getFieldValue('baseAmount') || 0)}
                      </div>
                      <div style={{ color: '#666' }}>基准金额</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0f2f5', borderRadius: '6px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                        {formatCurrency(totalAmount - (form.getFieldValue('baseAmount') || 0))}
                      </div>
                      <div style={{ color: '#666' }}>总费用</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0f2f5', borderRadius: '6px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
                        {formatCurrency(totalAmount)}
                      </div>
                      <div style={{ color: '#666' }}>结算总额</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0f2f5', borderRadius: '6px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                        {feeDetails.length}
                      </div>
                      <div style={{ color: '#666' }}>费用项目</div>
                    </div>
                  </Col>
                </Row>

                <Table
                  columns={feeDetailColumns}
                  dataSource={feeDetails}
                  rowKey="feeType"
                  pagination={false}
                  size="small"
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4}>
                        <strong>合计</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <strong style={{ color: '#52c41a' }}>
                          {formatCurrency(totalAmount)}
                        </strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              </Card>

              <Card title="结算设置" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="到期时间"
                      name="dueDate"
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        placeholder="请选择到期时间"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="结算说明"
                  name="description"
                >
                  <TextArea
                    rows={3}
                    placeholder="请输入结算说明"
                  />
                </Form.Item>
              </Card>
            </div>
          )}

          {/* 操作按钮 */}
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={handlePrevStep}>
                  上一步
                </Button>
              )}
              {currentStep < 2 && (
                <Button
                  type="primary"
                  onClick={handleNextStep}
                  loading={loading}
                  icon={currentStep === 1 ? <CalculatorOutlined /> : undefined}
                >
                  {currentStep === 1 ? '计算费用' : '下一步'}
                </Button>
              )}
              {currentStep === 2 && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={creating}
                  onClick={handleCreateSettlement}
                >
                  创建结算记录
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default SettlementCreate