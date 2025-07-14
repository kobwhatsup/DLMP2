import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Table,
  message,
  Form,
  Select,
  Input,
  InputNumber,
  Row,
  Col,
  Statistic,
  Progress,
  Steps,
  Modal,
  Tag,
  Tooltip,
  Alert,
  Divider,
  Tabs,
  DatePicker,
  Switch,
  Typography,
  Badge,
  Descriptions,
  Upload,
  Radio
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { MediationCase, MediationRecord, DocumentTemplate, Case } from '@/types'
import { mediationService, assignmentService } from '@/services'
import { formatDateTime, formatCurrency } from '@/utils'

const { Option } = Select
const { Step } = Steps
const { TabPane } = Tabs
const { RangePicker } = DatePicker
const { TextArea } = Input
const { Text, Title } = Typography

interface MediationState {
  mediationCases: MediationCase[]
  mediationRecords: MediationRecord[]
  documentTemplates: DocumentTemplate[]
  loading: boolean
  currentCase: MediationCase | null
  statsData: {
    totalCases: number
    successCount: number
    failedCount: number
    inProgressCount: number
    successRate: number
    avgDuration: number
    avgSettlementAmount: number
  }
}

const MediationManagement: React.FC = () => {
  const [state, setState] = useState<MediationState>({
    mediationCases: [],
    mediationRecords: [],
    documentTemplates: [],
    loading: false,
    currentCase: null,
    statsData: {
      totalCases: 0,
      successCount: 0,
      failedCount: 0,
      inProgressCount: 0,
      successRate: 0,
      avgDuration: 0,
      avgSettlementAmount: 0
    }
  })

  const [activeTab, setActiveTab] = useState('cases')
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isRecordModalVisible, setIsRecordModalVisible] = useState(false)
  const [isDocumentModalVisible, setIsDocumentModalVisible] = useState(false)
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [createType, setCreateType] = useState<'manual' | 'from-case'>('manual')
  const [availableCases, setAvailableCases] = useState<Case[]>([])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [mediators, setMediators] = useState<any[]>([])
  const [mediationCenters, setMediationCenters] = useState<any[]>([])
  const [form] = Form.useForm()
  const [recordForm] = Form.useForm()
  const [documentForm] = Form.useForm()
  const [notificationForm] = Form.useForm()
  const [createForm] = Form.useForm()

  // 调解案件表格列
  const caseColumns: ColumnsType<MediationCase> = [
    {
      title: '案件编号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      width: 140,
      fixed: 'left'
    },
    {
      title: '借款人',
      dataIndex: 'borrowerName',
      key: 'borrowerName',
      width: 100
    },
    {
      title: '债务金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: '调解员',
      dataIndex: 'mediatorName',
      key: 'mediatorName',
      width: 120
    },
    {
      title: '调解中心',
      dataIndex: 'mediationCenterName',
      key: 'mediationCenterName',
      width: 150,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => {
        const statusMap = {
          1: { color: 'orange', text: '待调解' },
          2: { color: 'blue', text: '调解中' },
          3: { color: 'green', text: '调解成功' },
          4: { color: 'red', text: '调解失败' },
          5: { color: 'default', text: '已撤案' }
        }
        const statusInfo = statusMap[status as keyof typeof statusMap]
        return <Tag color={statusInfo?.color}>{statusInfo?.text}</Tag>
      }
    },
    {
      title: '进度',
      dataIndex: 'step',
      key: 'step',
      width: 150,
      render: (step: number) => {
        const stepMap = {
          1: '案件受理',
          2: '联系当事人',
          3: '调解进行中',
          4: '达成协议',
          5: '调解完成'
        }
        return (
          <div>
            <Progress 
              percent={(step / 5) * 100} 
              size="small" 
              showInfo={false}
              status={step === 5 ? 'success' : 'active'}
            />
            <Text style={{ fontSize: '12px' }}>{stepMap[step as keyof typeof stepMap]}</Text>
          </div>
        )
      }
    },
    {
      title: '调解方式',
      dataIndex: 'mediationMethod',
      key: 'mediationMethod',
      width: 100,
      render: (method: string) => {
        const methodMap = {
          online: { color: 'blue', text: '线上' },
          offline: { color: 'green', text: '线下' },
          phone: { color: 'orange', text: '电话' }
        }
        const methodInfo = methodMap[method as keyof typeof methodMap]
        return <Tag color={methodInfo?.color}>{methodInfo?.text}</Tag>
      }
    },
    {
      title: '预约时间',
      dataIndex: 'appointmentTime',
      key: 'appointmentTime',
      width: 160,
      render: (time: string) => time ? formatDateTime(time) : '-'
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
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
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewCase(record)}
            />
          </Tooltip>
          <Tooltip title="添加记录">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleAddRecord(record)}
            />
          </Tooltip>
          <Tooltip title="生成文书">
            <Button
              type="link"
              icon={<FileTextOutlined />}
              size="small"
              onClick={() => handleGenerateDocument(record)}
            />
          </Tooltip>
          <Tooltip title="发送通知">
            <Button
              type="link"
              icon={<SendOutlined />}
              size="small"
              onClick={() => handleSendNotification(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  // 获取调解案件列表
  const fetchMediationCases = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await mediationService.getMediationList({
        page: 1,
        size: 50
      })
      const cases = response?.records || response || []
      setState(prev => ({ 
        ...prev, 
        mediationCases: cases,
        loading: false
      }))
    } catch (error) {
      message.error('获取调解案件失败')
      setState(prev => ({ ...prev, loading: false, mediationCases: [] }))
    }
  }

  // 获取调解统计
  const fetchMediationStats = async () => {
    try {
      const response = await mediationService.getMediationStats()
      const stats = response || {}
      setState(prev => ({
        ...prev,
        statsData: {
          totalCases: 0,
          successCount: 0,
          failedCount: 0,
          inProgressCount: 0,
          successRate: 0,
          avgDuration: 0,
          avgSettlementAmount: 0,
          ...stats
        }
      }))
    } catch (error) {
      message.error('获取调解统计失败')
    }
  }

  // 获取文书模板
  const fetchDocumentTemplates = async () => {
    try {
      const response = await mediationService.getDocumentTemplates()
      const templates = response || []
      setState(prev => ({ ...prev, documentTemplates: templates }))
    } catch (error) {
      message.error('获取文书模板失败')
    }
  }

  // 查看案件详情
  const handleViewCase = async (record: MediationCase) => {
    setState(prev => ({ ...prev, currentCase: record }))
    setIsDetailModalVisible(true)
    
    // 加载调解记录
    try {
      const response = await mediationService.getMediationRecords(record.id)
      const records = response?.data || []
      setState(prev => ({ ...prev, mediationRecords: records }))
    } catch (error) {
      message.error('获取调解记录失败')
    }
  }

  // 添加调解记录
  const handleAddRecord = (record: MediationCase) => {
    setState(prev => ({ ...prev, currentCase: record }))
    recordForm.resetFields()
    setIsRecordModalVisible(true)
  }

  // 保存调解记录
  const handleSaveRecord = async () => {
    try {
      const values = await recordForm.validateFields()
      if (!state.currentCase) return

      await mediationService.addMediationRecord(state.currentCase.id, values)
      message.success('调解记录添加成功')
      setIsRecordModalVisible(false)
      
      // 重新加载记录
      const response = await mediationService.getMediationRecords(state.currentCase.id)
      const records = response?.data || []
      setState(prev => ({ ...prev, mediationRecords: records }))
    } catch (error) {
      message.error('添加调解记录失败')
    }
  }

  // 生成文书
  const handleGenerateDocument = (record: MediationCase) => {
    setState(prev => ({ ...prev, currentCase: record }))
    documentForm.resetFields()
    setIsDocumentModalVisible(true)
  }

  // 保存生成文书
  const handleSaveDocument = async () => {
    try {
      const values = await documentForm.validateFields()
      if (!state.currentCase) return

      const response = await mediationService.generateDocument(state.currentCase.id, values)
      message.success('文书生成成功')
      setIsDocumentModalVisible(false)
      
      // 提供下载链接
      if (response?.data?.downloadUrl) {
        Modal.success({
          title: '文书生成成功',
          content: (
            <div>
              <p>文书已生成：{response.data.fileName}</p>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={() => window.open(response.data.downloadUrl, '_blank')}
              >
                下载文书
              </Button>
            </div>
          )
        })
      }
    } catch (error) {
      message.error('生成文书失败')
    }
  }

  // 发送通知
  const handleSendNotification = (record: MediationCase) => {
    setState(prev => ({ ...prev, currentCase: record }))
    notificationForm.resetFields()
    setIsNotificationModalVisible(true)
  }

  // 保存发送通知
  const handleSaveNotification = async () => {
    try {
      const values = await notificationForm.validateFields()
      if (!state.currentCase) return

      await mediationService.sendNotification(state.currentCase.id, values)
      message.success('通知发送成功')
      setIsNotificationModalVisible(false)
    } catch (error) {
      message.error('发送通知失败')
    }
  }

  // 更新调解步骤
  const handleUpdateStep = async (caseId: number, step: number) => {
    try {
      await mediationService.updateMediationStep(caseId, step)
      message.success('调解步骤更新成功')
      fetchMediationCases()
    } catch (error) {
      message.error('更新调解步骤失败')
    }
  }

  // 新建调解案件
  const handleCreateMediation = async () => {
    setIsCreateModalVisible(true)
    setCreateType('manual')
    createForm.resetFields()
    
    // 加载调解员和调解中心数据
    try {
      const [mediatorsRes, centersRes] = await Promise.all([
        mediationService.getMediators(),
        assignmentService.getMediationCenters()
      ])
      setMediators(mediatorsRes?.data || [])
      setMediationCenters(centersRes?.data || [])
    } catch (error) {
      message.error('加载数据失败')
    }
  }

  // 切换创建方式
  const handleCreateTypeChange = async (type: 'manual' | 'from-case') => {
    setCreateType(type)
    createForm.resetFields()
    
    if (type === 'from-case') {
      // 加载可用案件
      try {
        const response = await mediationService.getAvailableCases({ page: 1, size: 50 })
        setAvailableCases(response?.records || [])
      } catch (error) {
        message.error('获取可用案件失败')
      }
    }
  }

  // 选择案件
  const handleCaseSelect = (caseId: number) => {
    const selected = availableCases.find(c => c.id === caseId)
    setSelectedCase(selected || null)
    if (selected) {
      createForm.setFieldsValue({
        borrowerName: selected.debtorName,
        amount: selected.amount,
        debtorIdCard: selected.debtorIdCard,
        debtorPhone: selected.debtorPhone,
        clientName: selected.clientName
      })
    }
  }

  // 保存新建调解案件
  const handleSaveCreateMediation = async () => {
    try {
      const values = await createForm.validateFields()
      
      if (createType === 'from-case' && selectedCase) {
        // 从现有案件创建
        await mediationService.createFromCase({
          caseId: selectedCase.id,
          mediatorId: values.mediatorId,
          mediationCenterId: values.mediationCenterId,
          mediationMethod: values.mediationMethod,
          appointmentTime: values.appointmentTime?.format('YYYY-MM-DD HH:mm:ss'),
          mediationPlan: values.mediationPlan,
          remarks: values.remarks
        })
      } else {
        // 手动创建新案件
        await mediationService.createMediationCase({
          ...values,
          appointmentTime: values.appointmentTime?.format('YYYY-MM-DD HH:mm:ss'),
          createFromCase: false
        })
      }
      
      message.success('调解案件创建成功')
      setIsCreateModalVisible(false)
      fetchMediationCases()
    } catch (error) {
      message.error('创建调解案件失败')
    }
  }

  useEffect(() => {
    if (activeTab === 'cases') {
      fetchMediationCases()
    } else if (activeTab === 'stats') {
      fetchMediationStats()
    }
  }, [activeTab])

  useEffect(() => {
    fetchMediationCases()
    fetchMediationStats()
    fetchDocumentTemplates()
  }, [])

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        {/* 调解案件管理 */}
        <TabPane tab="调解案件" key="cases">
          {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总案件数"
                  value={state.mediationCases.length}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="调解中"
                  value={state.mediationCases.filter(c => c.status === 2).length}
                  prefix={<PlayCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="调解成功"
                  value={state.mediationCases.filter(c => c.status === 3).length}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="成功率"
                  value={state.mediationCases.length > 0 ? 
                    (state.mediationCases.filter(c => c.status === 3).length / state.mediationCases.length * 100).toFixed(1) : 0}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 操作按钮 */}
          <Card style={{ marginBottom: 16 }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchMediationCases}
              >
                刷新
              </Button>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateMediation}
              >
                新建调解
              </Button>
            </Space>
          </Card>

          {/* 调解案件列表 */}
          <Card title="调解案件列表">
            <Table
              columns={caseColumns}
              dataSource={state.mediationCases}
              rowKey="id"
              loading={state.loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1400 }}
            />
          </Card>
        </TabPane>

        {/* 调解统计 */}
        <TabPane tab="调解统计" key="stats">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总调解案件"
                  value={state.statsData.totalCases}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="调解成功率"
                  value={(state.statsData.successRate * 100).toFixed(1)}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均调解时长"
                  value={state.statsData.avgDuration}
                  suffix="天"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均和解金额"
                  value={state.statsData.avgSettlementAmount}
                  formatter={(value) => `¥${Number(value).toLocaleString()}`}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Card title="调解状态分布">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Badge count={state.statsData.successCount} style={{ backgroundColor: '#52c41a' }}>
                    <div style={{ padding: '20px', border: '1px dashed #d9d9d9', borderRadius: '6px' }}>
                      调解成功
                    </div>
                  </Badge>
                  <br /><br />
                  <Badge count={state.statsData.failedCount} style={{ backgroundColor: '#ff4d4f' }}>
                    <div style={{ padding: '20px', border: '1px dashed #d9d9d9', borderRadius: '6px' }}>
                      调解失败
                    </div>
                  </Badge>
                  <br /><br />
                  <Badge count={state.statsData.inProgressCount} style={{ backgroundColor: '#1890ff' }}>
                    <div style={{ padding: '20px', border: '1px dashed #d9d9d9', borderRadius: '6px' }}>
                      进行中
                    </div>
                  </Badge>
                </div>
              </Card>
            </Col>
            <Col span={16}>
              <Card title="调解趋势">
                <Alert
                  message="调解趋势图表"
                  description="此处可以显示调解案件的时间趋势、成功率变化等图表数据。"
                  type="info"
                  showIcon
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* 案件详情弹窗 */}
      <Modal
        title="调解案件详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {state.currentCase && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="案件编号">{state.currentCase.caseNumber}</Descriptions.Item>
              <Descriptions.Item label="借款人">{state.currentCase.borrowerName}</Descriptions.Item>
              <Descriptions.Item label="债务金额">{formatCurrency(state.currentCase.amount)}</Descriptions.Item>
              <Descriptions.Item label="调解员">{state.currentCase.mediatorName}</Descriptions.Item>
              <Descriptions.Item label="调解中心">{state.currentCase.mediationCenterName}</Descriptions.Item>
              <Descriptions.Item label="调解方式">
                {state.currentCase.mediationMethod === 'online' ? '线上调解' : 
                 state.currentCase.mediationMethod === 'offline' ? '线下调解' : '电话调解'}
              </Descriptions.Item>
              <Descriptions.Item label="调解地点">{state.currentCase.mediationLocation}</Descriptions.Item>
              <Descriptions.Item label="预约时间">{state.currentCase.appointmentTime}</Descriptions.Item>
              <Descriptions.Item label="预期时长">{state.currentCase.expectedDuration}分钟</Descriptions.Item>
              <Descriptions.Item label="调解计划" span={2}>{state.currentCase.mediationPlan}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{state.currentCase.remarks}</Descriptions.Item>
            </Descriptions>

            <Divider>调解进度</Divider>
            <Steps
              current={state.currentCase.step - 1}
              items={[
                { title: '案件受理', description: '接收分案案件' },
                { title: '联系当事人', description: '联系债权人和债务人' },
                { title: '调解进行中', description: '组织调解会议' },
                { title: '达成协议', description: '双方达成一致' },
                { title: '调解完成', description: '完成调解程序' }
              ]}
            />

            <Divider>调解记录</Divider>
            {state.mediationRecords.length > 0 ? (
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {state.mediationRecords.map((record) => (
                  <Card key={record.id} size="small" style={{ marginBottom: 8 }}>
                    <div>
                      <Text strong>{record.title}</Text>
                      <Text type="secondary" style={{ float: 'right' }}>
                        {formatDateTime(record.createTime)}
                      </Text>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text>{record.content}</Text>
                    </div>
                    {record.attachments && record.attachments.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {record.attachments.map((file, index) => (
                          <Tag key={index} icon={<FileTextOutlined />}>
                            {file.name}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Alert message="暂无调解记录" type="info" />
            )}
          </div>
        )}
      </Modal>

      {/* 添加调解记录弹窗 */}
      <Modal
        title="添加调解记录"
        open={isRecordModalVisible}
        onOk={handleSaveRecord}
        onCancel={() => setIsRecordModalVisible(false)}
        width={600}
      >
        <Form form={recordForm} layout="vertical">
          <Form.Item
            name="type"
            label="记录类型"
            rules={[{ required: true, message: '请选择记录类型' }]}
          >
            <Select placeholder="请选择记录类型">
              <Option value="contact">联系沟通</Option>
              <Option value="mediation">调解会议</Option>
              <Option value="document">文书处理</Option>
              <Option value="agreement">协议达成</Option>
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
            <TextArea rows={4} placeholder="请输入详细的调解记录内容" />
          </Form.Item>
          
          <Form.Item
            name="contactTime"
            label="联系时间"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 生成文书弹窗 */}
      <Modal
        title="生成调解文书"
        open={isDocumentModalVisible}
        onOk={handleSaveDocument}
        onCancel={() => setIsDocumentModalVisible(false)}
        width={600}
      >
        <Form form={documentForm} layout="vertical">
          <Form.Item
            name="templateId"
            label="文书模板"
            rules={[{ required: true, message: '请选择文书模板' }]}
          >
            <Select placeholder="请选择文书模板">
              {state.documentTemplates.map(template => (
                <Option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="title"
            label="文书标题"
            rules={[{ required: true, message: '请输入文书标题' }]}
          >
            <Input placeholder="请输入文书标题" />
          </Form.Item>
          
          <Form.Item
            name="agreementAmount"
            label="协议金额"
          >
            <Input placeholder="请输入协议金额（元）" />
          </Form.Item>
          
          <Form.Item
            name="paymentMethod"
            label="还款方式"
          >
            <Select placeholder="请选择还款方式">
              <Option value="lump_sum">一次性还款</Option>
              <Option value="installment">分期还款</Option>
              <Option value="deferred">延期还款</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="paymentSchedule"
            label="还款计划"
          >
            <TextArea rows={3} placeholder="请输入详细的还款计划" />
          </Form.Item>
          
          <Form.Item
            name="additionalTerms"
            label="附加条款"
          >
            <TextArea rows={3} placeholder="请输入附加条款" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 发送通知弹窗 */}
      <Modal
        title="发送调解通知"
        open={isNotificationModalVisible}
        onOk={handleSaveNotification}
        onCancel={() => setIsNotificationModalVisible(false)}
        width={600}
      >
        <Form form={notificationForm} layout="vertical">
          <Form.Item
            name="type"
            label="通知方式"
            rules={[{ required: true, message: '请选择通知方式' }]}
          >
            <Radio.Group>
              <Radio value="sms">短信通知</Radio>
              <Radio value="email">邮件通知</Radio>
              <Radio value="phone">电话通知</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            name="recipient"
            label="接收人"
            rules={[{ required: true, message: '请输入接收人信息' }]}
          >
            <Input placeholder="请输入手机号或邮箱地址" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="通知内容"
            rules={[{ required: true, message: '请输入通知内容' }]}
          >
            <TextArea rows={4} placeholder="请输入通知内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建调解案件弹窗 */}
      <Modal
        title="新建调解案件"
        open={isCreateModalVisible}
        onOk={handleSaveCreateMediation}
        onCancel={() => setIsCreateModalVisible(false)}
        width={800}
        okText="创建"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          {/* 创建方式选择 */}
          <Form.Item label="创建方式">
            <Radio.Group 
              value={createType} 
              onChange={(e) => handleCreateTypeChange(e.target.value)}
            >
              <Radio value="manual">手动创建</Radio>
              <Radio value="from-case">从现有案件创建</Radio>
            </Radio.Group>
          </Form.Item>

          {/* 从现有案件创建时的案件选择 */}
          {createType === 'from-case' && (
            <Form.Item
              name="caseId"
              label="选择案件"
              rules={[{ required: true, message: '请选择案件' }]}
            >
              <Select 
                placeholder="请选择要创建调解的案件"
                onChange={handleCaseSelect}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {availableCases.map(caseItem => (
                  <Option key={caseItem.id} value={caseItem.id}>
                    {caseItem.caseNo} - {caseItem.debtorName} - {formatCurrency(caseItem.amount)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="borrowerName"
                label="借款人姓名"
                rules={[{ required: true, message: '请输入借款人姓名' }]}
              >
                <Input 
                  placeholder="请输入借款人姓名" 
                  disabled={createType === 'from-case' && selectedCase}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="债务金额"
                rules={[{ required: true, message: '请输入债务金额' }]}
              >
                <InputNumber 
                  placeholder="请输入债务金额"
                  style={{ width: '100%' }}
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/¥\s?|(,*)/g, '')}
                  disabled={createType === 'from-case' && selectedCase}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="debtorIdCard"
                label="身份证号"
              >
                <Input 
                  placeholder="请输入身份证号" 
                  disabled={createType === 'from-case' && selectedCase}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="debtorPhone"
                label="联系电话"
              >
                <Input 
                  placeholder="请输入联系电话"
                  disabled={createType === 'from-case' && selectedCase}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="clientName"
            label="委托方"
          >
            <Input 
              placeholder="请输入委托方名称"
              disabled={createType === 'from-case' && selectedCase}
            />
          </Form.Item>

          <Divider>调解安排</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mediationCenterId"
                label="调解中心"
                rules={[{ required: true, message: '请选择调解中心' }]}
              >
                <Select placeholder="请选择调解中心">
                  {mediationCenters.map(center => (
                    <Option key={center.id} value={center.id}>
                      {center.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mediatorId"
                label="调解员"
                rules={[{ required: true, message: '请选择调解员' }]}
              >
                <Select placeholder="请选择调解员">
                  {mediators.map(mediator => (
                    <Option key={mediator.id} value={mediator.id}>
                      {mediator.name} - {mediator.mediationCenterName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mediationMethod"
                label="调解方式"
                initialValue="online"
              >
                <Select placeholder="请选择调解方式">
                  <Option value="online">线上调解</Option>
                  <Option value="offline">线下调解</Option>
                  <Option value="phone">电话调解</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="appointmentTime"
                label="预约时间"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  placeholder="请选择调解时间"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="expectedDuration"
                label="预期时长（分钟）"
                initialValue={120}
              >
                <InputNumber 
                  placeholder="请输入预期时长"
                  style={{ width: '100%' }}
                  min={30}
                  max={480}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mediationLocation"
                label="调解地点"
              >
                <Input placeholder="请输入调解地点" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="mediationPlan"
            label="调解计划"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入调解计划和策略"
            />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="备注"
          >
            <TextArea 
              rows={2} 
              placeholder="请输入备注信息"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MediationManagement