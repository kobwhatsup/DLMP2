import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Row,
  Col,
  Table,
  InputNumber,
  DatePicker,
  Divider,
  Alert,
  Spin
} from 'antd'
import {
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { settlementService } from '@/services'
import { formatCurrency } from '@/utils'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface FeeDetail {
  id?: number
  feeType: number
  feeTypeName: string
  description: string
  amount: number
  calculationMethod: string
  baseAmount?: number
  rate?: number
}

const SettlementEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settlementData, setSettlementData] = useState<any>(null)
  const [feeDetails, setFeeDetails] = useState<FeeDetail[]>([])

  // 费用明细表格列定义
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
      width: 200,
      render: (text: string, record: FeeDetail, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleFeeDetailChange(index, 'description', e.target.value)}
          placeholder="请输入费用说明"
        />
      )
    },
    {
      title: '计算方式',
      dataIndex: 'calculationMethod',
      key: 'calculationMethod',
      width: 150
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount: number, record: FeeDetail, index: number) => (
        <InputNumber
          value={amount}
          onChange={(value) => handleFeeDetailChange(index, 'amount', value || 0)}
          style={{ width: '100%' }}
          min={0}
          step={100}
          formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value!.replace(/¥\s?|(,*)/g, '')}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record: FeeDetail, index: number) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() => handleRemoveFeeDetail(index)}
        />
      )
    }
  ]

  // 获取结算详情
  const fetchSettlementDetail = async () => {
    if (!id) return
    
    setLoading(true)
    try {
      const response = await settlementService.getSettlementById(Number(id))
      const data = response.data
      
      setSettlementData(data)
      setFeeDetails(data.feeDetails || [])
      
      // 设置表单初始值
      form.setFieldsValue({
        settlementType: data.settlementType,
        dueDate: data.dueDate ? dayjs(data.dueDate) : null,
        description: data.description
      })
    } catch (error) {
      message.error('获取结算详情失败')
      navigate('/settlement/list')
    } finally {
      setLoading(false)
    }
  }

  // 保存结算记录
  const handleSave = async (values: any) => {
    if (!id) return
    
    setSaving(true)
    try {
      const updateData = {
        settlementType: values.settlementType,
        feeDetails: feeDetails,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
        description: values.description
      }
      
      await settlementService.updateSettlement(Number(id), updateData)
      message.success('结算记录更新成功')
      navigate('/settlement/list')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 修改费用明细
  const handleFeeDetailChange = (index: number, field: string, value: any) => {
    const newFeeDetails = [...feeDetails]
    newFeeDetails[index] = {
      ...newFeeDetails[index],
      [field]: value
    }
    setFeeDetails(newFeeDetails)
  }

  // 删除费用明细
  const handleRemoveFeeDetail = (index: number) => {
    const newFeeDetails = [...feeDetails]
    newFeeDetails.splice(index, 1)
    setFeeDetails(newFeeDetails)
  }

  // 添加费用明细
  const handleAddFeeDetail = () => {
    const newFeeDetail: FeeDetail = {
      feeType: 1,
      feeTypeName: '服务费',
      description: '',
      amount: 0,
      calculationMethod: '手动输入'
    }
    setFeeDetails([...feeDetails, newFeeDetail])
  }

  // 返回列表
  const handleBack = () => {
    navigate('/settlement/list')
  }

  useEffect(() => {
    fetchSettlementDetail()
  }, [id])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!settlementData) {
    return (
      <Card>
        <Alert
          message="未找到结算记录"
          description="请检查结算记录ID是否正确"
          type="error"
          showIcon
        />
      </Card>
    )
  }

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
            编辑结算记录 - {settlementData.settlementNumber}
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => form.submit()}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Alert
            message="编辑说明"
            description="只有草稿状态的结算记录才能编辑。已审核或已付款的记录不允许修改。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          {/* 基本信息 */}
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <div>
                  <strong>结算单号：</strong>
                  {settlementData.settlementNumber}
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <strong>案件编号：</strong>
                  {settlementData.caseNumber}
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <strong>委托客户：</strong>
                  {settlementData.clientName}
                </div>
              </Col>
            </Row>
          </Card>

          {/* 结算信息 */}
          <Card title="结算信息" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
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
              <Col span={8}>
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
              <Col span={8}>
                <div>
                  <strong>当前状态：</strong>
                  <span style={{ 
                    color: settlementData.status === 1 ? '#faad14' : 
                           settlementData.status === 4 ? '#52c41a' : '#1890ff'
                  }}>
                    {settlementData.status === 1 ? '草稿' : 
                     settlementData.status === 2 ? '待审核' :
                     settlementData.status === 3 ? '已审核' :
                     settlementData.status === 4 ? '已付款' : '未知状态'}
                  </span>
                </div>
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

          {/* 费用明细 */}
          <Card
            title="费用明细"
            size="small"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={handleAddFeeDetail}
              >
                添加费用项
              </Button>
            }
          >
            <Table
              columns={feeDetailColumns}
              dataSource={feeDetails}
              rowKey={(record, index) => index || 0}
              pagination={false}
              size="small"
              summary={() => {
                const totalAmount = feeDetails.reduce((sum, item) => sum + item.amount, 0)
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <strong>合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <strong style={{ color: '#52c41a' }}>
                        {formatCurrency(totalAmount)}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                  </Table.Summary.Row>
                )
              }}
            />
          </Card>
        </Form>
      </Card>
    </div>
  )
}

export default SettlementEdit