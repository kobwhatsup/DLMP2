import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Progress,
  Alert,
  Spin,
  Divider,
  Timeline,
  Row,
  Col
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  AuditOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { settlementService } from '@/services'
import { formatCurrency, formatDateTime } from '@/utils'
import { SettlementStatus, FeeType } from '@/types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const SettlementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [settlementData, setSettlementData] = useState<any>(null)
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false)

  // 费用明细表格列
  const feeDetailColumns = [
    {
      title: '费用类型',
      dataIndex: 'feeType',
      key: 'feeType',
      render: (feeType: FeeType) => {
        const typeMap = {
          [FeeType.SERVICE_FEE]: '服务费',
          [FeeType.LITIGATION_FEE]: '诉讼费',
          [FeeType.EXECUTION_FEE]: '执行费',
          [FeeType.COMMISSION]: '佣金',
          [FeeType.OTHER]: '其他费用'
        }
        return <Tag color="blue">{typeMap[feeType] || '未知'}</Tag>
      }
    },
    {
      title: '费用说明',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '计算方式',
      dataIndex: 'calculationMethod',
      key: 'calculationMethod'
    },
    {
      title: '基准金额',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      render: (amount: number) => amount ? formatCurrency(amount) : '-'
    },
    {
      title: '费率',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => rate ? `${rate}%` : '-'
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {formatCurrency(amount)}
        </span>
      )
    }
  ]

  // 获取结算详情
  const fetchSettlementDetail = async () => {
    if (!id) return
    
    setLoading(true)
    try {
      const response = await settlementService.getSettlementById(Number(id))
      setSettlementData(response.data)
    } catch (error) {
      message.error('获取结算详情失败')
      navigate('/settlement/list')
    } finally {
      setLoading(false)
    }
  }

  // 返回列表
  const handleBack = () => {
    navigate('/settlement/list')
  }

  // 编辑结算
  const handleEdit = () => {
    navigate(`/settlement/edit/${id}`)
  }

  // 提交审核
  const handleSubmitApproval = async () => {
    try {
      await settlementService.submitSettlement(Number(id))
      message.success('提交审核成功')
      fetchSettlementDetail()
    } catch (error) {
      message.error('提交审核失败')
    }
  }

  // 审核结算
  const handleApproval = async (values: any) => {
    try {
      await settlementService.approveSettlement(
        Number(id),
        values.approved,
        values.reason
      )
      message.success(values.approved ? '审核通过' : '审核拒绝')
      setIsApprovalModalVisible(false)
      form.resetFields()
      fetchSettlementDetail()
    } catch (error) {
      message.error('审核失败')
    }
  }

  // 确认付款
  const handlePayment = async (values: any) => {
    try {
      await settlementService.confirmPayment(Number(id), {
        paidAmount: values.paidAmount,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        paymentMethod: values.paymentMethod,
        transactionId: values.transactionId,
        remarks: values.remarks
      })
      message.success('付款确认成功')
      setIsPaymentModalVisible(false)
      form.resetFields()
      fetchSettlementDetail()
    } catch (error) {
      message.error('付款确认失败')
    }
  }

  // 下载结算单
  const handleDownload = async () => {
    try {
      const response = await settlementService.downloadSettlement(Number(id))
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = `结算单_${settlementData?.settlementNumber || id}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('下载成功')
    } catch (error) {
      message.error('下载失败')
    }
  }

  // 获取状态标签
  const getStatusTag = (status: SettlementStatus) => {
    const statusMap = {
      [SettlementStatus.DRAFT]: { color: 'default', text: '草稿' },
      [SettlementStatus.PENDING]: { color: 'processing', text: '待审核' },
      [SettlementStatus.APPROVED]: { color: 'success', text: '已审核' },
      [SettlementStatus.PAID]: { color: 'success', text: '已付款' },
      [SettlementStatus.PARTIAL_PAID]: { color: 'warning', text: '部分付款' },
      [SettlementStatus.OVERDUE]: { color: 'error', text: '逾期' },
      [SettlementStatus.CANCELLED]: { color: 'default', text: '已取消' }
    }
    const statusInfo = statusMap[status]
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
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

  const completionRate = (settlementData.paidAmount / settlementData.totalAmount) * 100

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
            结算详情 - {settlementData.settlementNumber}
          </Space>
        }
        extra={
          <Space>
            {settlementData.status === SettlementStatus.DRAFT && (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                >
                  编辑
                </Button>
                <Button
                  type="primary"
                  icon={<AuditOutlined />}
                  onClick={handleSubmitApproval}
                >
                  提交审核
                </Button>
              </>
            )}
            {settlementData.status === SettlementStatus.PENDING && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => setIsApprovalModalVisible(true)}
              >
                审核
              </Button>
            )}
            {[SettlementStatus.APPROVED, SettlementStatus.PARTIAL_PAID].includes(settlementData.status) && (
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => setIsPaymentModalVisible(true)}
              >
                确认付款
              </Button>
            )}
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              下载结算单
            </Button>
          </Space>
        }
      >
        {/* 基本信息 */}
        <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
          <Descriptions column={3} bordered>
            <Descriptions.Item label="结算单号">{settlementData.settlementNumber}</Descriptions.Item>
            <Descriptions.Item label="案件编号">{settlementData.caseNumber}</Descriptions.Item>
            <Descriptions.Item label="委托客户">{settlementData.clientName}</Descriptions.Item>
            <Descriptions.Item label="结算类型">
              {settlementData.settlementType === 'mediation' ? '调解结算' :
               settlementData.settlementType === 'litigation' ? '诉讼结算' :
               settlementData.settlementType === 'execution' ? '执行结算' : '服务费结算'}
            </Descriptions.Item>
            <Descriptions.Item label="结算状态">
              {getStatusTag(settlementData.status)}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(settlementData.createTime)}
            </Descriptions.Item>
            <Descriptions.Item label="到期时间">
              {settlementData.dueDate ? formatDateTime(settlementData.dueDate) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建人">{settlementData.creatorName}</Descriptions.Item>
            <Descriptions.Item label="完成率">
              <Progress
                percent={Math.round(completionRate)}
                size="small"
                strokeColor={completionRate === 100 ? '#52c41a' : completionRate > 50 ? '#faad14' : '#ff4d4f'}
              />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 金额信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {formatCurrency(settlementData.totalAmount)}
                </div>
                <div style={{ color: '#666' }}>结算总额</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {formatCurrency(settlementData.paidAmount)}
                </div>
                <div style={{ color: '#666' }}>已收金额</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                  {formatCurrency(settlementData.unpaidAmount)}
                </div>
                <div style={{ color: '#666' }}>未收金额</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                  {Math.round(completionRate)}%
                </div>
                <div style={{ color: '#666' }}>完成率</div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 费用明细 */}
        {settlementData.feeDetails && settlementData.feeDetails.length > 0 && (
          <Card title="费用明细" size="small" style={{ marginBottom: 16 }}>
            <Table
              columns={feeDetailColumns}
              dataSource={settlementData.feeDetails}
              rowKey="id"
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <strong>合计</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <strong style={{ color: '#52c41a' }}>
                      {formatCurrency(settlementData.totalAmount)}
                    </strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        )}

        {/* 结算说明 */}
        {settlementData.description && (
          <Card title="结算说明" size="small" style={{ marginBottom: 16 }}>
            <p>{settlementData.description}</p>
          </Card>
        )}

        {/* 操作日志 */}
        <Card title="操作日志" size="small">
          <Timeline>
            <Timeline.Item
              dot={<ClockCircleOutlined />}
              color="blue"
            >
              <div>
                <div><strong>创建结算记录</strong></div>
                <div style={{ color: '#666' }}>
                  {formatDateTime(settlementData.createTime)} 由 {settlementData.creatorName} 创建
                </div>
              </div>
            </Timeline.Item>
            {settlementData.status >= SettlementStatus.PENDING && (
              <Timeline.Item
                dot={<AuditOutlined />}
                color="orange"
              >
                <div>
                  <div><strong>提交审核</strong></div>
                  <div style={{ color: '#666' }}>
                    {formatDateTime(settlementData.createTime)} 提交审核
                  </div>
                </div>
              </Timeline.Item>
            )}
            {settlementData.status >= SettlementStatus.APPROVED && (
              <Timeline.Item
                dot={<CheckCircleOutlined />}
                color="green"
              >
                <div>
                  <div><strong>审核通过</strong></div>
                  <div style={{ color: '#666' }}>
                    审核通过，可以进行付款操作
                  </div>
                </div>
              </Timeline.Item>
            )}
            {settlementData.status === SettlementStatus.PAID && (
              <Timeline.Item
                dot={<DollarOutlined />}
                color="green"
              >
                <div>
                  <div><strong>付款完成</strong></div>
                  <div style={{ color: '#666' }}>
                    结算记录已完成，全部金额已收到
                  </div>
                </div>
              </Timeline.Item>
            )}
          </Timeline>
        </Card>
      </Card>

      {/* 付款确认弹窗 */}
      <Modal
        title="确认付款"
        open={isPaymentModalVisible}
        onCancel={() => {
          setIsPaymentModalVisible(false)
          form.resetFields()
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePayment}
        >
          <Alert
            message={`未收金额：${formatCurrency(settlementData.unpaidAmount)}`}
            type="info"
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            label="付款金额"
            name="paidAmount"
            rules={[
              { required: true, message: '请输入付款金额' },
              {
                validator: (_, value) => {
                  if (value > settlementData.unpaidAmount) {
                    return Promise.reject('付款金额不能大于未收金额')
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={settlementData.unpaidAmount}
              step={100}
              placeholder="请输入付款金额"
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/¥\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            label="付款日期"
            name="paymentDate"
            rules={[{ required: true, message: '请选择付款日期' }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="付款方式"
            name="paymentMethod"
            rules={[{ required: true, message: '请选择付款方式' }]}
          >
            <Select placeholder="请选择付款方式">
              <Option value="bank_transfer">银行转账</Option>
              <Option value="online_payment">线上支付</Option>
              <Option value="cash">现金</Option>
              <Option value="check">支票</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="交易流水号"
            name="transactionId"
          >
            <Input placeholder="请输入交易流水号" />
          </Form.Item>

          <Form.Item
            label="备注"
            name="remarks"
          >
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => {
                setIsPaymentModalVisible(false)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确认付款
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 审核弹窗 */}
      <Modal
        title="审核结算"
        open={isApprovalModalVisible}
        onCancel={() => {
          setIsApprovalModalVisible(false)
          form.resetFields()
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApproval}
        >
          <Form.Item
            label="审核结果"
            name="approved"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select placeholder="请选择审核结果">
              <Option value={true}>通过</Option>
              <Option value={false}>拒绝</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="审核意见"
            name="reason"
          >
            <TextArea rows={3} placeholder="请输入审核意见" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => {
                setIsApprovalModalVisible(false)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                提交审核
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SettlementDetail