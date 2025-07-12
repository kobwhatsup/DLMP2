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
  Timeline,
  Progress,
  Descriptions,
  Upload
} from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  FileTextOutlined,
  PhoneOutlined,
  MessageOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { MediationCase, MediationStatus, MediationRecord } from '@/types'
import { mediationService } from '@/services'
import StatusTag from '@/components/Common/StatusTag'
import { formatDateTime, formatCurrency } from '@/utils'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { RangePicker } = DatePicker
const { TextArea } = Input
const { Step } = Steps

interface MediationListState {
  cases: MediationCase[]
  loading: boolean
  total: number
  current: number
  pageSize: number
}

interface SearchParams {
  caseNumber?: string
  borrowerName?: string
  mediatorName?: string
  status?: MediationStatus
  createTimeRange?: string[]
}

const MediationList: React.FC = () => {
  const navigate = useNavigate()
  const [listState, setListState] = useState<MediationListState>({
    cases: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10
  })
  
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isRecordModalVisible, setIsRecordModalVisible] = useState(false)
  const [currentCase, setCurrentCase] = useState<MediationCase | null>(null)
  const [mediationRecords, setMediationRecords] = useState<MediationRecord[]>([])
  const [form] = Form.useForm()

  // 表格列定义
  const columns: ColumnsType<MediationCase> = [
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
      title: '调解员',
      dataIndex: 'mediatorName',
      key: 'mediatorName',
      width: 100
    },
    {
      title: '调解状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: MediationStatus) => {
        const statusMap = {
          [MediationStatus.PENDING]: { color: 'default', text: '待开始' },
          [MediationStatus.IN_PROGRESS]: { color: 'processing', text: '进行中' },
          [MediationStatus.SUCCESS]: { color: 'success', text: '调解成功' },
          [MediationStatus.FAILED]: { color: 'error', text: '调解失败' },
          [MediationStatus.SUSPENDED]: { color: 'warning', text: '已暂停' }
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
        const getProgressColor = (status: MediationStatus) => {
          switch (status) {
            case MediationStatus.SUCCESS: return '#52c41a'
            case MediationStatus.FAILED: return '#ff4d4f'
            case MediationStatus.SUSPENDED: return '#faad14'
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
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (time: string) => time ? formatDateTime(time) : '-'
    },
    {
      title: '期限',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 160,
      render: (deadline: string, record) => {
        if (!deadline) return '-'
        const isOverdue = new Date(deadline) < new Date() && record.status === MediationStatus.IN_PROGRESS
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {formatDateTime(deadline)}
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
          <Tooltip title="调解记录">
            <Button
              type="link"
              icon={<FileTextOutlined />}
              size="small"
              onClick={() => handleViewRecords(record)}
            />
          </Tooltip>
          {record.status === MediationStatus.IN_PROGRESS && (
            <>
              <Tooltip title="电话联系">
                <Button
                  type="link"
                  icon={<PhoneOutlined />}
                  size="small"
                  onClick={() => handlePhoneContact(record)}
                />
              </Tooltip>
              <Tooltip title="发送消息">
                <Button
                  type="link"
                  icon={<MessageOutlined />}
                  size="small"
                  onClick={() => handleSendMessage(record)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="更新状态">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleUpdateStatus(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  // 获取调解案件列表
  const fetchCases = async () => {
    setListState(prev => ({ ...prev, loading: true }))
    try {
      const response = await mediationService.getMediationList({
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
      message.error('获取调解案件列表失败')
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
  const handleViewDetail = (mediationCase: MediationCase) => {
    setCurrentCase(mediationCase)
    setIsDetailModalVisible(true)
  }

  // 查看调解记录
  const handleViewRecords = async (mediationCase: MediationCase) => {
    try {
      const records = await mediationService.getMediationRecords(mediationCase.id)
      setMediationRecords(records.data)
      setCurrentCase(mediationCase)
      setIsRecordModalVisible(true)
    } catch (error) {
      message.error('获取调解记录失败')
    }
  }

  // 电话联系
  const handlePhoneContact = (mediationCase: MediationCase) => {
    Modal.confirm({
      title: '确认拨打电话',
      content: `即将拨打电话给 ${mediationCase.borrowerName}: ${mediationCase.phone}`,
      onOk: async () => {
        try {
          await mediationService.recordPhoneCall(mediationCase.id, {
            type: 'outbound',
            duration: 0,
            notes: '系统记录 - 发起通话'
          })
          message.success('通话记录已保存')
          // 实际项目中这里可以集成电话系统
          window.open(`tel:${mediationCase.phone}`)
        } catch (error) {
          message.error('记录通话失败')
        }
      }
    })
  }

  // 发送消息
  const handleSendMessage = (mediationCase: MediationCase) => {
    Modal.confirm({
      title: '发送调解通知',
      content: (
        <div>
          <p>收件人: {mediationCase.borrowerName}</p>
          <p>手机号: {mediationCase.phone}</p>
          <TextArea
            placeholder="请输入消息内容"
            rows={4}
            defaultValue={`【调解通知】您的案件 ${mediationCase.caseNumber} 正在调解中，请及时配合调解员工作。如有疑问请联系调解员。`}
          />
        </div>
      ),
      onOk: async () => {
        try {
          await mediationService.sendNotification(mediationCase.id, {
            type: 'sms',
            content: '调解通知已发送',
            recipient: mediationCase.phone
          })
          message.success('消息发送成功')
        } catch (error) {
          message.error('消息发送失败')
        }
      }
    })
  }

  // 更新状态
  const handleUpdateStatus = (mediationCase: MediationCase) => {
    navigate(`/mediation/process/${mediationCase.id}`)
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
              <Form.Item name="mediatorName" label="调解员">
                <Input placeholder="请输入调解员姓名" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="status" label="调解状态">
                <Select placeholder="请选择调解状态" allowClear>
                  <Option value={MediationStatus.PENDING}>待开始</Option>
                  <Option value={MediationStatus.IN_PROGRESS}>进行中</Option>
                  <Option value={MediationStatus.SUCCESS}>调解成功</Option>
                  <Option value={MediationStatus.FAILED}>调解失败</Option>
                  <Option value={MediationStatus.SUSPENDED}>已暂停</Option>
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
            icon={<CalendarOutlined />}
            onClick={() => navigate('/mediation/schedule')}
          >
            调解排期
          </Button>
          <Button 
            icon={<FileTextOutlined />}
            onClick={() => navigate('/mediation/documents')}
          >
            文书管理
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchCases}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 调解案件表格 */}
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
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 案件详情弹窗 */}
      <Modal
        title="调解案件详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {currentCase && (
          <div>
            <Descriptions title="基本信息" bordered>
              <Descriptions.Item label="案件编号">{currentCase.caseNumber}</Descriptions.Item>
              <Descriptions.Item label="借款人">{currentCase.borrowerName}</Descriptions.Item>
              <Descriptions.Item label="债务金额">{formatCurrency(currentCase.debtAmount)}</Descriptions.Item>
              <Descriptions.Item label="调解员">{currentCase.mediatorName}</Descriptions.Item>
              <Descriptions.Item label="调解中心">{currentCase.mediationCenterName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentCase.phone}</Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {currentCase.startTime ? formatDateTime(currentCase.startTime) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="期限">
                {currentCase.deadline ? formatDateTime(currentCase.deadline) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="当前状态" span={3}>
                <Tag color={currentCase.status === MediationStatus.SUCCESS ? 'green' : 
                           currentCase.status === MediationStatus.FAILED ? 'red' : 'blue'}>
                  {currentCase.status === MediationStatus.PENDING ? '待开始' :
                   currentCase.status === MediationStatus.IN_PROGRESS ? '进行中' :
                   currentCase.status === MediationStatus.SUCCESS ? '调解成功' :
                   currentCase.status === MediationStatus.FAILED ? '调解失败' : '已暂停'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {currentCase.description && (
              <div style={{ marginTop: 16 }}>
                <h4>案件描述</h4>
                <p>{currentCase.description}</p>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <h4>调解进度</h4>
              <Steps
                current={currentCase.currentStep || 0}
                status={currentCase.status === MediationStatus.FAILED ? 'error' : 
                        currentCase.status === MediationStatus.SUCCESS ? 'finish' : 'process'}
                items={[
                  {
                    title: '案件分配',
                    description: '案件已分配给调解员'
                  },
                  {
                    title: '联系债务人',
                    description: '调解员联系债务人'
                  },
                  {
                    title: '调解协商',
                    description: '进行调解协商'
                  },
                  {
                    title: '达成协议',
                    description: '双方达成调解协议'
                  },
                  {
                    title: '完成调解',
                    description: '调解流程完成'
                  }
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 调解记录弹窗 */}
      <Modal
        title="调解记录"
        open={isRecordModalVisible}
        onCancel={() => setIsRecordModalVisible(false)}
        footer={null}
        width={700}
      >
        {currentCase && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>案件编号：</strong>{currentCase.caseNumber}
              <br />
              <strong>借款人：</strong>{currentCase.borrowerName}
            </div>
            
            <Timeline>
              {mediationRecords.map((record, index) => (
                <Timeline.Item
                  key={record.id}
                  color={record.type === 'success' ? 'green' : 
                         record.type === 'failed' ? 'red' : 'blue'}
                  dot={record.type === 'call' ? <PhoneOutlined /> : 
                       record.type === 'meeting' ? <CalendarOutlined /> : 
                       record.type === 'success' ? <CheckCircleOutlined /> :
                       record.type === 'failed' ? <CloseCircleOutlined /> : 
                       <ClockCircleOutlined />}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{record.title}</div>
                    <div style={{ color: '#666', fontSize: '12px', marginBottom: 8 }}>
                      {formatDateTime(record.createTime)} - {record.operatorName}
                    </div>
                    <div>{record.content}</div>
                    {record.attachments && record.attachments.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <strong>附件：</strong>
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
            
            {mediationRecords.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                暂无调解记录
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MediationList