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
  Steps,
  Progress,
  Descriptions,
  Timeline,
  Upload,
  Divider
} from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BankOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { LitigationCase, LitigationStatus, LitigationStage, ExecutionRecord } from '@/types'
import { litigationService } from '@/services'
import StatusTag from '@/components/Common/StatusTag'
import { formatDateTime, formatCurrency } from '@/utils'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { RangePicker } = DatePicker
const { TextArea } = Input
const { Step } = Steps

interface LitigationListState {
  cases: LitigationCase[]
  loading: boolean
  total: number
  current: number
  pageSize: number
}

interface SearchParams {
  caseNumber?: string
  borrowerName?: string
  courtName?: string
  status?: LitigationStatus
  stage?: LitigationStage
  createTimeRange?: string[]
}

const LitigationList: React.FC = () => {
  const navigate = useNavigate()
  const [listState, setListState] = useState<LitigationListState>({
    cases: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10
  })
  
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isExecutionModalVisible, setIsExecutionModalVisible] = useState(false)
  const [currentCase, setCurrentCase] = useState<LitigationCase | null>(null)
  const [executionRecords, setExecutionRecords] = useState<ExecutionRecord[]>([])
  const [form] = Form.useForm()

  // 诉讼阶段配置
  const litigationStages = [
    { key: LitigationStage.PREPARATION, label: '诉前准备', color: 'blue' },
    { key: LitigationStage.FILING, label: '立案审查', color: 'orange' },
    { key: LitigationStage.TRIAL, label: '开庭审理', color: 'purple' },
    { key: LitigationStage.JUDGMENT, label: '判决执行', color: 'cyan' },
    { key: LitigationStage.EXECUTION, label: '强制执行', color: 'red' },
    { key: LitigationStage.COMPLETED, label: '执行完毕', color: 'green' }
  ]

  // 表格列定义
  const columns: ColumnsType<LitigationCase> = [
    {
      title: '案件编号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
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
      title: '借款人',
      dataIndex: 'borrowerName',
      key: 'borrowerName',
      width: 100
    },
    {
      title: '债务金额',
      dataIndex: 'debtAmount',
      key: 'debtAmount',
      width: 120,
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: '法院',
      dataIndex: 'courtName',
      key: 'courtName',
      width: 150,
      ellipsis: true
    },
    {
      title: '案件号',
      dataIndex: 'courtCaseNumber',
      key: 'courtCaseNumber',
      width: 140,
      ellipsis: true
    },
    {
      title: '诉讼阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 120,
      render: (stage: LitigationStage) => {
        const stageInfo = litigationStages.find(s => s.key === stage)
        return <Tag color={stageInfo?.color}>{stageInfo?.label}</Tag>
      }
    },
    {
      title: '诉讼状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: LitigationStatus) => {
        const statusMap = {
          [LitigationStatus.PREPARING]: { color: 'default', text: '准备中' },
          [LitigationStatus.FILED]: { color: 'processing', text: '已立案' },
          [LitigationStatus.IN_TRIAL]: { color: 'processing', text: '审理中' },
          [LitigationStatus.JUDGMENT_ISSUED]: { color: 'success', text: '已判决' },
          [LitigationStatus.IN_EXECUTION]: { color: 'warning', text: '执行中' },
          [LitigationStatus.EXECUTED]: { color: 'success', text: '已执行' },
          [LitigationStatus.CLOSED]: { color: 'default', text: '已结案' }
        }
        const statusInfo = statusMap[status]
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress: number, record) => {
        const getProgressColor = (status: LitigationStatus) => {
          switch (status) {
            case LitigationStatus.EXECUTED: return '#52c41a'
            case LitigationStatus.CLOSED: return '#52c41a'
            case LitigationStatus.IN_EXECUTION: return '#faad14'
            default: return '#1890ff'
          }
        }
        return (
          <Progress 
            percent={progress} 
            size="small" 
            strokeColor={getProgressColor(record.status)}
          />
        )
      }
    },
    {
      title: '立案时间',
      dataIndex: 'filingDate',
      key: 'filingDate',
      width: 160,
      render: (date: string) => date ? formatDateTime(date) : '-'
    },
    {
      title: '执行回款',
      dataIndex: 'recoveredAmount',
      key: 'recoveredAmount',
      width: 120,
      render: (amount: number) => amount ? formatCurrency(amount) : '-'
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
          <Tooltip title="进度管理">
            <Button
              type="link"
              icon={<CalendarOutlined />}
              size="small"
              onClick={() => navigate(`/litigation/process/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="执行记录">
            <Button
              type="link"
              icon={<BankOutlined />}
              size="small"
              onClick={() => handleViewExecution(record)}
            />
          </Tooltip>
          <Tooltip title="文书管理">
            <Button
              type="link"
              icon={<FileTextOutlined />}
              size="small"
              onClick={() => navigate(`/litigation/documents/${record.id}`)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  // 获取诉讼案件列表
  const fetchCases = async () => {
    setListState(prev => ({ ...prev, loading: true }))
    try {
      const response = await litigationService.getLitigationList({
        ...searchParams,
        page: listState.current,
        size: listState.pageSize
      })
      
      setListState(prev => ({
        ...prev,
        cases: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取诉讼案件列表失败')
      setListState(prev => ({ ...prev, loading: false }))
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
  const handleViewDetail = (litigationCase: LitigationCase) => {
    setCurrentCase(litigationCase)
    setIsDetailModalVisible(true)
  }

  // 查看执行记录
  const handleViewExecution = async (litigationCase: LitigationCase) => {
    try {
      const records = await litigationService.getExecutionRecords(litigationCase.id)
      setExecutionRecords(records.data)
      setCurrentCase(litigationCase)
      setIsExecutionModalVisible(true)
    } catch (error) {
      message.error('获取执行记录失败')
    }
  }

  // 新增诉讼案件
  const handleAddCase = () => {
    navigate('/litigation/create')
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
    fetchCases()
  }, [listState.current, listState.pageSize, searchParams])

  return (
    <div>
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
              <Form.Item name="borrowerName" label="借款人">
                <Input placeholder="请输入借款人姓名" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="courtName" label="法院">
                <Input placeholder="请输入法院名称" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="stage" label="诉讼阶段">
                <Select placeholder="请选择诉讼阶段" allowClear>
                  {litigationStages.map(stage => (
                    <Option key={stage.key} value={stage.key}>{stage.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="status" label="诉讼状态">
                <Select placeholder="请选择诉讼状态" allowClear>
                  <Option value={LitigationStatus.PREPARING}>准备中</Option>
                  <Option value={LitigationStatus.FILED}>已立案</Option>
                  <Option value={LitigationStatus.IN_TRIAL}>审理中</Option>
                  <Option value={LitigationStatus.JUDGMENT_ISSUED}>已判决</Option>
                  <Option value={LitigationStatus.IN_EXECUTION}>执行中</Option>
                  <Option value={LitigationStatus.EXECUTED}>已执行</Option>
                  <Option value={LitigationStatus.CLOSED}>已结案</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="createTimeRange" label="立案时间">
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
            onClick={handleAddCase}
          >
            新增诉讼
          </Button>
          <Button 
            icon={<CalendarOutlined />}
            onClick={() => navigate('/litigation/schedule')}
          >
            开庭排期
          </Button>
          <Button 
            icon={<FileTextOutlined />}
            onClick={() => navigate('/litigation/templates')}
          >
            文书模板
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchCases}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 诉讼案件表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={listState.cases}
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

      {/* 案件详情弹窗 */}
      <Modal
        title="诉讼案件详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {currentCase && (
          <div>
            <Descriptions title="基本信息" bordered>
              <Descriptions.Item label="案件编号">{currentCase.caseNumber}</Descriptions.Item>
              <Descriptions.Item label="借款人">{currentCase.borrowerName}</Descriptions.Item>
              <Descriptions.Item label="债务金额">{formatCurrency(currentCase.debtAmount)}</Descriptions.Item>
              <Descriptions.Item label="法院">{currentCase.courtName}</Descriptions.Item>
              <Descriptions.Item label="案件号">{currentCase.courtCaseNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="承办法官">{currentCase.judgeName || '-'}</Descriptions.Item>
              <Descriptions.Item label="原告律师">{currentCase.plaintiffLawyer || '-'}</Descriptions.Item>
              <Descriptions.Item label="立案时间">
                {currentCase.filingDate ? formatDateTime(currentCase.filingDate) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="开庭时间">
                {currentCase.trialDate ? formatDateTime(currentCase.trialDate) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="当前阶段" span={3}>
                <Tag color={litigationStages.find(s => s.key === currentCase.stage)?.color}>
                  {litigationStages.find(s => s.key === currentCase.stage)?.label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <h4>诉讼进度</h4>
              <Steps
                current={currentCase.stage}
                status={currentCase.status === LitigationStatus.CLOSED ? 'finish' : 'process'}
                items={[
                  {
                    title: '诉前准备',
                    description: '收集证据，准备诉讼材料',
                    icon: <FileTextOutlined />
                  },
                  {
                    title: '立案审查',
                    description: '法院受理立案',
                    icon: <BankOutlined />
                  },
                  {
                    title: '开庭审理',
                    description: '法庭审理案件',
                    icon: <CalendarOutlined />
                  },
                  {
                    title: '判决执行',
                    description: '法院作出判决',
                    icon: <CheckCircleOutlined />
                  },
                  {
                    title: '强制执行',
                    description: '申请强制执行',
                    icon: <ExclamationCircleOutlined />
                  },
                  {
                    title: '执行完毕',
                    description: '案件执行结束',
                    icon: <CheckCircleOutlined />
                  }
                ]}
              />
            </div>

            {currentCase.caseDescription && (
              <div style={{ marginTop: 16 }}>
                <h4>案件描述</h4>
                <p>{currentCase.caseDescription}</p>
              </div>
            )}

            {currentCase.judgmentAmount && (
              <div style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <strong>判决金额:</strong> {formatCurrency(currentCase.judgmentAmount)}
                  </Col>
                  <Col span={8}>
                    <strong>已执行金额:</strong> {formatCurrency(currentCase.recoveredAmount || 0)}
                  </Col>
                  <Col span={8}>
                    <strong>执行率:</strong> {((currentCase.recoveredAmount || 0) / currentCase.judgmentAmount * 100).toFixed(1)}%
                  </Col>
                </Row>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 执行记录弹窗 */}
      <Modal
        title="执行记录"
        open={isExecutionModalVisible}
        onCancel={() => setIsExecutionModalVisible(false)}
        footer={null}
        width={800}
      >
        {currentCase && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>案件编号：</strong>{currentCase.caseNumber}
              <br />
              <strong>借款人：</strong>{currentCase.borrowerName}
              <br />
              <strong>判决金额：</strong>{formatCurrency(currentCase.judgmentAmount || 0)}
              <br />
              <strong>已执行金额：</strong>{formatCurrency(currentCase.recoveredAmount || 0)}
            </div>
            
            <Divider />
            
            <Timeline>
              {executionRecords.map((record, index) => (
                <Timeline.Item
                  key={record.id}
                  color={record.type === 'payment' ? 'green' : 
                         record.type === 'seizure' ? 'orange' : 'blue'}
                  dot={record.type === 'payment' ? <DollarOutlined /> : 
                       record.type === 'seizure' ? <BankOutlined /> : 
                       <ClockCircleOutlined />}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{record.title}</div>
                    <div style={{ color: '#666', fontSize: '12px', marginBottom: 8 }}>
                      {formatDateTime(record.executeTime)} - {record.executorName}
                    </div>
                    <div>{record.content}</div>
                    {record.amount && (
                      <div style={{ marginTop: 8, color: '#52c41a', fontWeight: 'bold' }}>
                        执行金额: {formatCurrency(record.amount)}
                      </div>
                    )}
                    {record.attachments && record.attachments.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <strong>相关文件：</strong>
                        {record.attachments.map((file, fileIndex) => (
                          <a key={fileIndex} href={file.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                            <DownloadOutlined /> {file.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
            
            {executionRecords.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                暂无执行记录
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default LitigationList