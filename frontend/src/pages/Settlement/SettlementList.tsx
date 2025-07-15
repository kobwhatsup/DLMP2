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
  Tooltip,
  DatePicker,
  Statistic,
  Progress,
  Descriptions,
  Alert,
  Divider
} from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DollarOutlined,
  CalculatorOutlined,
  FileTextOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  AuditOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { SettlementRecord, SettlementStatus, FeeType } from '@/types'
import { settlementService } from '@/services'
import { formatDateTime, formatCurrency } from '@/utils'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { RangePicker } = DatePicker

interface SettlementListState {
  settlements: SettlementRecord[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  stats: {
    totalAmount: number
    paidAmount: number
    pendingAmount: number
    overdueAmount: number
  }
}

interface SearchParams {
  caseNumber?: string
  clientName?: string
  status?: SettlementStatus
  settlementType?: string
  createTimeRange?: string[]
  amountRange?: [number, number]
}

const SettlementList: React.FC = () => {
  const navigate = useNavigate()
  const [listState, setListState] = useState<SettlementListState>({
    settlements: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10,
    stats: {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0
    }
  })
  
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentSettlement, setCurrentSettlement] = useState<SettlementRecord | null>(null)
  const [form] = Form.useForm()

  // 表格列定义
  const columns: ColumnsType<SettlementRecord> = [
    {
      title: '结算单号',
      dataIndex: 'settlementNumber',
      key: 'settlementNumber',
      width: 140,
      render: (text, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => handleViewDetail(record)}
        >
          {text}
        </Button>
      )
    },
    {
      title: '案件编号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      width: 140
    },
    {
      title: '委托客户',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 150,
      ellipsis: true
    },
    {
      title: '结算类型',
      dataIndex: 'settlementType',
      key: 'settlementType',
      width: 120,
      render: (type: string) => {
        const typeMap = {
          mediation: '调解结算',
          litigation: '诉讼结算',
          execution: '执行结算',
          service: '服务费结算'
        }
        return typeMap[type as keyof typeof typeMap] || type
      }
    },
    {
      title: '结算金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {formatCurrency(amount)}
        </span>
      ),
      sorter: true
    },
    {
      title: '已收金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: '#52c41a' }}>
          {formatCurrency(amount)}
        </span>
      )
    },
    {
      title: '未收金额',
      dataIndex: 'unpaidAmount',
      key: 'unpaidAmount',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#ff4d4f' : '#666' }}>
          {formatCurrency(amount)}
        </span>
      )
    },
    {
      title: '结算状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: SettlementStatus) => {
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
    },
    {
      title: '完成率',
      key: 'completionRate',
      width: 100,
      render: (_, record) => {
        const rate = (record.paidAmount / record.totalAmount) * 100
        return (
          <Progress 
            percent={Math.round(rate)} 
            size="small" 
            strokeColor={rate === 100 ? '#52c41a' : rate > 50 ? '#faad14' : '#ff4d4f'}
            format={percent => `${percent}%`}
          />
        )
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => formatDateTime(time)
    },
    {
      title: '到期时间',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 160,
      render: (date: string, record) => {
        if (!date) return '-'
        const isOverdue = new Date(date) < new Date() && record.status !== SettlementStatus.PAID
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {formatDateTime(date)}
            {isOverdue && <Tag color="red" size="small" style={{ marginLeft: 4 }}>逾期</Tag>}
          </span>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/settlement/edit/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="费用计算">
            <Button
              type="link"
              icon={<CalculatorOutlined />}
              size="small"
              onClick={() => navigate(`/settlement/calculate/${record.id}`)}
            />
          </Tooltip>
          {record.status === SettlementStatus.DRAFT && (
            <Tooltip title="提交审核">
              <Button
                type="link"
                icon={<AuditOutlined />}
                size="small"
                onClick={() => handleSubmitForApproval(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="下载结算单">
            <Button
              type="link"
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => handleDownloadSettlement(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  // 获取结算列表
  const fetchSettlements = async () => {
    setListState(prev => ({ ...prev, loading: true }))
    try {
      const response = await settlementService.getSettlementList({
        ...searchParams,
        page: listState.current,
        size: listState.pageSize
      })
      
      setListState(prev => ({
        ...prev,
        settlements: response.records,
        total: response.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取结算列表失败')
      setListState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取结算统计
  const fetchSettlementStats = async () => {
    try {
      const response = await settlementService.getSettlementStats(searchParams)
      setListState(prev => ({ ...prev, stats: response }))
    } catch (error) {
      message.error('获取统计信息失败')
    }
  }

  // 搜索
  const handleSearch = (params: SearchParams) => {
    setSearchParams(params)
    setListState(prev => ({ ...prev, current: 1 }))
  }

  // 重置搜索
  const handleReset = () => {
    setSearchParams({})
    setListState(prev => ({ ...prev, current: 1 }))
  }

  // 查看详情
  const handleViewDetail = (settlement: SettlementRecord) => {
    setCurrentSettlement(settlement)
    setIsDetailModalVisible(true)
  }

  // 提交审核
  const handleSubmitForApproval = async (id: number) => {
    Modal.confirm({
      title: '提交审核',
      content: '确认提交该结算单进行审核吗？',
      onOk: async () => {
        try {
          await settlementService.submitSettlement(id)
          message.success('提交成功')
          fetchSettlements()
        } catch (error) {
          message.error('提交失败')
        }
      }
    })
  }

  // 下载结算单
  const handleDownloadSettlement = async (id: number) => {
    try {
      const response = await settlementService.downloadSettlement(id)
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = `结算单_${id}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('下载成功')
    } catch (error) {
      message.error('下载失败')
    }
  }

  // 新增结算
  const handleAddSettlement = () => {
    navigate('/settlement/create')
  }

  // 表格变化处理
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setListState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  useEffect(() => {
    fetchSettlements()
    fetchSettlementStats()
  }, [listState.current, listState.pageSize, searchParams])

  return (
    <div>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总结算金额"
              value={listState.stats.totalAmount}
              formatter={value => formatCurrency(Number(value))}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已收金额"
              value={listState.stats.paidAmount}
              formatter={value => formatCurrency(Number(value))}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待收金额"
              value={listState.stats.pendingAmount}
              formatter={value => formatCurrency(Number(value))}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="逾期金额"
              value={listState.stats.overdueAmount}
              formatter={value => formatCurrency(Number(value))}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          layout="inline"
          onFinish={handleSearch}
          initialValues={searchParams}
        >
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="caseNumber" label="案件编号">
                <Input placeholder="请输入案件编号" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="clientName" label="委托客户">
                <Input placeholder="请输入客户名称" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="settlementType" label="结算类型">
                <Select placeholder="请选择结算类型" allowClear>
                  <Option value="mediation">调解结算</Option>
                  <Option value="litigation">诉讼结算</Option>
                  <Option value="execution">执行结算</Option>
                  <Option value="service">服务费结算</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="status" label="结算状态">
                <Select placeholder="请选择结算状态" allowClear>
                  <Option value={SettlementStatus.DRAFT}>草稿</Option>
                  <Option value={SettlementStatus.PENDING}>待审核</Option>
                  <Option value={SettlementStatus.APPROVED}>已审核</Option>
                  <Option value={SettlementStatus.PAID}>已付款</Option>
                  <Option value={SettlementStatus.PARTIAL_PAID}>部分付款</Option>
                  <Option value={SettlementStatus.OVERDUE}>逾期</Option>
                  <Option value={SettlementStatus.CANCELLED}>已取消</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="createTimeRange" label="创建时间">
                <RangePicker placeholder={['开始时间', '结束时间']} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddSettlement}
          >
            新增结算
          </Button>
          <Button 
            icon={<FileTextOutlined />}
            onClick={() => navigate('/settlement/reports')}
          >
            结算报表
          </Button>
          <Button 
            icon={<CalculatorOutlined />}
            onClick={() => navigate('/settlement/calculator')}
          >
            费用计算器
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchSettlements}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 结算表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={listState.settlements}
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
          scroll={{ x: 1600 }}
        />
      </Card>

      {/* 结算详情弹窗 */}
      <Modal
        title="结算详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {currentSettlement && (
          <div>
            <Descriptions title="基本信息" bordered>
              <Descriptions.Item label="结算单号">{currentSettlement.settlementNumber}</Descriptions.Item>
              <Descriptions.Item label="案件编号">{currentSettlement.caseNumber}</Descriptions.Item>
              <Descriptions.Item label="委托客户">{currentSettlement.clientName}</Descriptions.Item>
              <Descriptions.Item label="结算类型">{currentSettlement.settlementType}</Descriptions.Item>
              <Descriptions.Item label="结算金额">
                <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                  {formatCurrency(currentSettlement.totalAmount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="已收金额">
                <span style={{ color: '#52c41a' }}>
                  {formatCurrency(currentSettlement.paidAmount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="未收金额">
                <span style={{ color: currentSettlement.unpaidAmount > 0 ? '#ff4d4f' : '#666' }}>
                  {formatCurrency(currentSettlement.unpaidAmount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="到期时间">
                {currentSettlement.dueDate ? formatDateTime(currentSettlement.dueDate) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(currentSettlement.createTime)}
              </Descriptions.Item>
            </Descriptions>

            {currentSettlement.feeDetails && currentSettlement.feeDetails.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>费用明细</h4>
                <Table
                  dataSource={currentSettlement.feeDetails}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '费用类型',
                      dataIndex: 'feeType',
                      key: 'feeType',
                      render: (type: FeeType) => {
                        const typeMap = {
                          [FeeType.SERVICE_FEE]: '服务费',
                          [FeeType.LITIGATION_FEE]: '诉讼费',
                          [FeeType.EXECUTION_FEE]: '执行费',
                          [FeeType.COMMISSION]: '佣金',
                          [FeeType.OTHER]: '其他费用'
                        }
                        return typeMap[type] || type
                      }
                    },
                    {
                      title: '费用说明',
                      dataIndex: 'description',
                      key: 'description'
                    },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (amount: number) => formatCurrency(amount)
                    },
                    {
                      title: '计算方式',
                      dataIndex: 'calculationMethod',
                      key: 'calculationMethod'
                    }
                  ]}
                />
              </div>
            )}

            {currentSettlement.description && (
              <div style={{ marginTop: 16 }}>
                <h4>结算说明</h4>
                <p>{currentSettlement.description}</p>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <Alert
                message="结算信息"
                description={
                  <div>
                    <p>完成率: {Math.round((currentSettlement.paidAmount / currentSettlement.totalAmount) * 100)}%</p>
                    <Progress 
                      percent={Math.round((currentSettlement.paidAmount / currentSettlement.totalAmount) * 100)}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                  </div>
                }
                type="info"
                showIcon
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SettlementList