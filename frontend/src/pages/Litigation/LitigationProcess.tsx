import React, { useState, useEffect } from 'react'
import {
  Card,
  Steps,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  message,
  Modal,
  Row,
  Col,
  Descriptions,
  Timeline,
  Tag,
  Space,
  Progress,
  Alert,
  Divider,
  InputNumber,
  Table
} from 'antd'
import {
  SaveOutlined,
  SendOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BankOutlined,
  DollarOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { LitigationCase, LitigationStatus, LitigationStage, ExecutionRecord, CourtEvent } from '@/types'
import { litigationService } from '@/services'
import { formatDateTime, formatCurrency } from '@/utils'
import type { ColumnsType } from 'antd/es/table'

const { Step } = Steps
const { TextArea } = Input
const { Option } = Select

interface ProcessState {
  litigationCase: LitigationCase | null
  currentStage: LitigationStage
  loading: boolean
  executionRecords: ExecutionRecord[]
  courtEvents: CourtEvent[]
}

const LitigationProcess: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<ProcessState>({
    litigationCase: null,
    currentStage: LitigationStage.PREPARATION,
    loading: false,
    executionRecords: [],
    courtEvents: []
  })
  
  const [isEventModalVisible, setIsEventModalVisible] = useState(false)
  const [isExecutionModalVisible, setIsExecutionModalVisible] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CourtEvent | null>(null)
  const [form] = Form.useForm()
  const [eventForm] = Form.useForm()
  const [executionForm] = Form.useForm()

  // 诉讼步骤配置
  const litigationSteps = [
    {
      title: '诉前准备',
      description: '收集证据，准备诉讼材料',
      stage: LitigationStage.PREPARATION,
      icon: <FileTextOutlined />
    },
    {
      title: '立案审查',
      description: '法院受理立案',
      stage: LitigationStage.FILING,
      icon: <BankOutlined />
    },
    {
      title: '开庭审理',
      description: '法庭审理案件',
      stage: LitigationStage.TRIAL,
      icon: <CalendarOutlined />
    },
    {
      title: '判决执行',
      description: '法院作出判决',
      stage: LitigationStage.JUDGMENT,
      icon: <CheckCircleOutlined />
    },
    {
      title: '强制执行',
      description: '申请强制执行',
      stage: LitigationStage.EXECUTION,
      icon: <ExclamationCircleOutlined />
    },
    {
      title: '执行完毕',
      description: '案件执行结束',
      stage: LitigationStage.COMPLETED,
      icon: <CheckCircleOutlined />
    }
  ]

  // 法院事件表格列
  const eventColumns: ColumnsType<CourtEvent> = [
    {
      title: '事件类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap = {
          filing: '立案',
          hearing: '开庭',
          judgment: '判决',
          execution: '执行',
          appeal: '上诉',
          other: '其他'
        }
        return typeMap[type as keyof typeof typeMap] || type
      }
    },
    {
      title: '事件名称',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '计划时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      width: 160,
      render: (time: string) => formatDateTime(time)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'default', text: '待进行' },
          completed: { color: 'success', text: '已完成' },
          cancelled: { color: 'error', text: '已取消' },
          postponed: { color: 'warning', text: '已延期' }
        }
        const statusInfo = statusMap[status as keyof typeof statusMap]
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditEvent(record)}
          />
          <Button
            type="link"
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteEvent(record.id)}
          />
        </Space>
      )
    }
  ]

  // 获取诉讼案件详情
  const fetchLitigationCase = async () => {
    if (!id) return
    
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await litigationService.getLitigationById(parseInt(id))
      setState(prev => ({ 
        ...prev, 
        litigationCase: response.data,
        currentStage: response.data.stage,
        loading: false
      }))
      
      // 填充表单
      form.setFieldsValue(response.data)
    } catch (error) {
      message.error('获取诉讼案件失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取法院事件
  const fetchCourtEvents = async () => {
    if (!id) return
    
    try {
      const response = await litigationService.getCourtEvents(parseInt(id))
      setState(prev => ({ ...prev, courtEvents: response.data }))
    } catch (error) {
      message.error('获取法院事件失败')
    }
  }

  // 获取执行记录
  const fetchExecutionRecords = async () => {
    if (!id) return
    
    try {
      const response = await litigationService.getExecutionRecords(parseInt(id))
      setState(prev => ({ ...prev, executionRecords: response.data }))
    } catch (error) {
      message.error('获取执行记录失败')
    }
  }

  // 保存诉讼信息
  const handleSave = async () => {
    if (!state.litigationCase) return
    
    try {
      const values = await form.validateFields()
      await litigationService.updateLitigation(state.litigationCase.id, values)
      message.success('保存成功')
      fetchLitigationCase()
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 更新阶段
  const handleStageChange = async (stage: LitigationStage) => {
    if (!state.litigationCase) return
    
    try {
      await litigationService.updateLitigationStage(state.litigationCase.id, stage)
      setState(prev => ({ ...prev, currentStage: stage }))
      message.success('阶段更新成功')
      fetchLitigationCase()
    } catch (error) {
      message.error('阶段更新失败')
    }
  }

  // 添加法院事件
  const handleAddEvent = () => {
    setEditingEvent(null)
    eventForm.resetFields()
    setIsEventModalVisible(true)
  }

  // 编辑法院事件
  const handleEditEvent = (event: CourtEvent) => {
    setEditingEvent(event)
    eventForm.setFieldsValue(event)
    setIsEventModalVisible(true)
  }

  // 保存法院事件
  const handleSaveEvent = async () => {
    if (!state.litigationCase) return
    
    try {
      const values = await eventForm.validateFields()
      
      if (editingEvent) {
        await litigationService.updateCourtEvent(editingEvent.id, values)
        message.success('事件更新成功')
      } else {
        await litigationService.addCourtEvent(state.litigationCase.id, values)
        message.success('事件添加成功')
      }
      
      setIsEventModalVisible(false)
      fetchCourtEvents()
    } catch (error) {
      message.error('事件保存失败')
    }
  }

  // 删除法院事件
  const handleDeleteEvent = async (eventId: number) => {
    try {
      await litigationService.deleteCourtEvent(eventId)
      message.success('事件删除成功')
      fetchCourtEvents()
    } catch (error) {
      message.error('事件删除失败')
    }
  }

  // 添加执行记录
  const handleAddExecution = () => {
    executionForm.resetFields()
    setIsExecutionModalVisible(true)
  }

  // 保存执行记录
  const handleSaveExecution = async () => {
    if (!state.litigationCase) return
    
    try {
      const values = await executionForm.validateFields()
      await litigationService.addExecutionRecord(state.litigationCase.id, values)
      message.success('执行记录添加成功')
      setIsExecutionModalVisible(false)
      fetchExecutionRecords()
      fetchLitigationCase() // 刷新案件信息
    } catch (error) {
      message.error('执行记录保存失败')
    }
  }

  // 完成诉讼
  const handleCompleteLitigation = () => {
    Modal.confirm({
      title: '确认完成诉讼',
      content: '请确认诉讼流程已完成，执行结果已确认',
      onOk: async () => {
        if (!state.litigationCase) return
        
        try {
          await litigationService.completeLitigation(state.litigationCase.id)
          message.success('诉讼完成')
          navigate('/litigation/list')
        } catch (error) {
          message.error('操作失败')
        }
      }
    })
  }

  useEffect(() => {
    fetchLitigationCase()
    fetchCourtEvents()
    fetchExecutionRecords()
  }, [id])

  if (!state.litigationCase) {
    return <div>加载中...</div>
  }

  return (
    <div>
      {/* 基本信息 */}
      <Card title="诉讼案件信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered>
          <Descriptions.Item label="案件编号">{state.litigationCase.caseNumber}</Descriptions.Item>
          <Descriptions.Item label="借款人">{state.litigationCase.borrowerName}</Descriptions.Item>
          <Descriptions.Item label="债务金额">{formatCurrency(state.litigationCase.debtAmount)}</Descriptions.Item>
          <Descriptions.Item label="法院">{state.litigationCase.courtName}</Descriptions.Item>
          <Descriptions.Item label="案件号">{state.litigationCase.courtCaseNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="承办法官">{state.litigationCase.judgeName || '-'}</Descriptions.Item>
          <Descriptions.Item label="当前阶段">
            <Tag color="blue">
              {litigationSteps.find(s => s.stage === state.currentStage)?.title}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="判决金额">
            {state.litigationCase.judgmentAmount ? formatCurrency(state.litigationCase.judgmentAmount) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="已执行金额">
            {state.litigationCase.recoveredAmount ? formatCurrency(state.litigationCase.recoveredAmount) : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 诉讼步骤 */}
      <Card title="诉讼流程" style={{ marginBottom: 16 }}>
        <Steps
          current={state.currentStage}
          status={state.litigationCase.status === LitigationStatus.CLOSED ? 'finish' : 'process'}
          onChange={handleStageChange}
          items={litigationSteps}
        />
        
        <div style={{ marginTop: 16 }}>
          <Progress 
            percent={(state.currentStage + 1) * 16.67} 
            strokeColor={state.litigationCase.status === LitigationStatus.CLOSED ? '#52c41a' : '#1890ff'}
          />
        </div>

        {state.currentStage >= LitigationStage.JUDGMENT && (
          <Alert
            message="执行阶段"
            description="案件已进入执行阶段，请及时跟踪执行进度并记录执行情况"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* 诉讼信息编辑 */}
      <Card 
        title="诉讼信息" 
        extra={
          <Space>
            <Button icon={<SaveOutlined />} onClick={handleSave}>
              保存
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="courtName" label="法院名称">
                <Input placeholder="请输入法院名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="courtCaseNumber" label="法院案件号">
                <Input placeholder="请输入法院案件号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="judgeName" label="承办法官">
                <Input placeholder="请输入承办法官" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="plaintiffLawyer" label="原告律师">
                <Input placeholder="请输入原告律师" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="filingDate" label="立案时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="trialDate" label="开庭时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="judgmentDate" label="判决时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="judgmentAmount" label="判决金额">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入判决金额"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="executionCourt" label="执行法院">
                <Input placeholder="请输入执行法院" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="caseDescription" label="案件描述">
            <TextArea
              placeholder="请输入案件描述和诉讼请求"
              rows={4}
              maxLength={1000}
              showCount
            />
          </Form.Item>
          
          <Form.Item name="remarks" label="备注">
            <TextArea
              placeholder="请输入备注信息"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Card>

      {/* 法院事件 */}
      <Card 
        title="法院事件" 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEvent}>
            添加事件
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={eventColumns}
          dataSource={state.courtEvents}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Card>

      {/* 执行记录 */}
      <Card 
        title="执行记录" 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddExecution}>
            添加记录
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Timeline>
          {state.executionRecords.map((record, index) => (
            <Timeline.Item
              key={record.id}
              color={record.type === 'payment' ? 'green' : 
                     record.type === 'seizure' ? 'orange' : 'blue'}
              dot={record.type === 'payment' ? <DollarOutlined /> : 
                   record.type === 'seizure' ? <BankOutlined /> : 
                   <FileTextOutlined />}
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
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
        
        {state.executionRecords.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
            暂无执行记录
          </div>
        )}
      </Card>

      {/* 操作按钮 */}
      <Card>
        <Space size="large">
          <Button 
            type="primary" 
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleCompleteLitigation}
            disabled={state.litigationCase.status === LitigationStatus.CLOSED}
          >
            完成诉讼
          </Button>
          <Button size="large" onClick={() => navigate('/litigation/list')}>
            返回列表
          </Button>
        </Space>
      </Card>

      {/* 添加法院事件弹窗 */}
      <Modal
        title={editingEvent ? '编辑事件' : '添加事件'}
        open={isEventModalVisible}
        onOk={handleSaveEvent}
        onCancel={() => setIsEventModalVisible(false)}
        width={600}
      >
        <Form
          form={eventForm}
          layout="vertical"
        >
          <Form.Item
            name="type"
            label="事件类型"
            rules={[{ required: true, message: '请选择事件类型' }]}
          >
            <Select placeholder="请选择事件类型">
              <Option value="filing">立案</Option>
              <Option value="hearing">开庭</Option>
              <Option value="judgment">判决</Option>
              <Option value="execution">执行</Option>
              <Option value="appeal">上诉</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="title"
            label="事件名称"
            rules={[{ required: true, message: '请输入事件名称' }]}
          >
            <Input placeholder="请输入事件名称" />
          </Form.Item>
          
          <Form.Item
            name="scheduledTime"
            label="计划时间"
            rules={[{ required: true, message: '请选择计划时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="location" label="地点">
            <Input placeholder="请输入事件地点" />
          </Form.Item>
          
          <Form.Item name="description" label="事件描述">
            <TextArea
              placeholder="请输入事件描述"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>
          
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" defaultValue="pending">
              <Option value="pending">待进行</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="postponed">已延期</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加执行记录弹窗 */}
      <Modal
        title="添加执行记录"
        open={isExecutionModalVisible}
        onOk={handleSaveExecution}
        onCancel={() => setIsExecutionModalVisible(false)}
        width={600}
      >
        <Form
          form={executionForm}
          layout="vertical"
        >
          <Form.Item
            name="type"
            label="执行类型"
            rules={[{ required: true, message: '请选择执行类型' }]}
          >
            <Select placeholder="请选择执行类型">
              <Option value="payment">还款</Option>
              <Option value="seizure">查封</Option>
              <Option value="auction">拍卖</Option>
              <Option value="inquiry">调查</Option>
              <Option value="negotiation">协商</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="title"
            label="记录标题"
            rules={[{ required: true, message: '请输入记录标题' }]}
          >
            <Input placeholder="请输入记录标题" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="记录内容"
            rules={[{ required: true, message: '请输入记录内容' }]}
          >
            <TextArea
              placeholder="请详细描述执行过程和结果"
              rows={6}
              maxLength={1000}
              showCount
            />
          </Form.Item>
          
          <Form.Item name="amount" label="执行金额">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入执行金额"
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/¥\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item name="executeTime" label="执行时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="attachments" label="相关文件">
            <Upload
              action="/api/litigation/upload"
              listType="text"
              maxCount={5}
            >
              <Button icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default LitigationProcess