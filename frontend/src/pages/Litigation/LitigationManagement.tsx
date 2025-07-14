import React, { useState, useEffect, useRef } from 'react'
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
  Typography,
  Badge,
  Descriptions,
  Radio,
  Timeline,
  Empty,
  Upload
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
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  DownloadOutlined,
  BankOutlined,
  DollarOutlined,
  UploadOutlined,
  InboxOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { LitigationCase, CourtEvent } from '@/types'
import { litigationService } from '@/services'
import { PageHeader } from '@/components'
import { formatDateTime, formatCurrency } from '@/utils'
import dayjs from 'dayjs'

const { Option } = Select
const { Step } = Steps
const { TabPane } = Tabs
const { RangePicker } = DatePicker
const { TextArea } = Input
const { Text, Title } = Typography

interface LitigationState {
  litigationCases: LitigationCase[]
  courtEvents: CourtEvent[]
  documentTemplates: any[]
  loading: boolean
  currentCase: LitigationCase | null
  statsData: {
    totalCases: number
    preparationCount: number
    filingCount: number
    trialCount: number
    executionCount: number
    completedCount: number
    totalDebtAmount: number
    totalRecoveredAmount: number
    recoveryRate: number
    avgProcessTime: number
  }
}

const LitigationManagement: React.FC = () => {
  const [state, setState] = useState<LitigationState>({
    litigationCases: [],
    courtEvents: [],
    documentTemplates: [],
    loading: false,
    currentCase: null,
    statsData: {
      totalCases: 0,
      preparationCount: 0,
      filingCount: 0,
      trialCount: 0,
      executionCount: 0,
      completedCount: 0,
      totalDebtAmount: 0,
      totalRecoveredAmount: 0,
      recoveryRate: 0,
      avgProcessTime: 0
    }
  })

  const [activeTab, setActiveTab] = useState('cases')
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isEventModalVisible, setIsEventModalVisible] = useState(false)
  const [isDocumentModalVisible, setIsDocumentModalVisible] = useState(false)
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false)
  const [availableMediationCases, setAvailableMediationCases] = useState<any[]>([])
  const templateContentRef = useRef<any>(null)
  const [uploadMode, setUploadMode] = useState(false)
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [eventForm] = Form.useForm()
  const [documentForm] = Form.useForm()
  const [templateForm] = Form.useForm()

  // 诉讼案件表格列
  const caseColumns: ColumnsType<LitigationCase> = [
    {
      title: '案件编号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      width: 160,
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
      title: '法院案号',
      dataIndex: 'courtCaseNumber',
      key: 'courtCaseNumber',
      width: 140,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => {
        const statusMap = {
          0: { color: 'orange', text: '诉前准备' },
          1: { color: 'blue', text: '立案审查' },
          2: { color: 'processing', text: '审理中' },
          3: { color: 'green', text: '执行中' },
          4: { color: 'success', text: '已结案' }
        }
        const statusInfo = statusMap[status as keyof typeof statusMap]
        return <Tag color={statusInfo?.color}>{statusInfo?.text}</Tag>
      }
    },
    {
      title: '诉讼阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 150,
      render: (stage: number, record: LitigationCase) => {
        const stageMap = {
          0: '诉前准备',
          1: '立案审查',
          2: '开庭审理',
          3: '判决生效',
          4: '强制执行',
          5: '执行完毕'
        }
        return (
          <div>
            <Progress 
              percent={(stage / 5) * 100} 
              size="small" 
              showInfo={false}
              status={stage === 5 ? 'success' : 'active'}
            />
            <Text style={{ fontSize: '12px' }}>{stageMap[stage as keyof typeof stageMap]}</Text>
          </div>
        )
      }
    },
    {
      title: '已回收金额',
      dataIndex: 'recoveredAmount',
      key: 'recoveredAmount',
      width: 120,
      render: (amount: number) => amount > 0 ? formatCurrency(amount) : '-'
    },
    {
      title: '立案时间',
      dataIndex: 'filingDate',
      key: 'filingDate',
      width: 110,
      render: (date: string) => date || '-'
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
      width: 180,
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
          <Tooltip title="添加事件">
            <Button
              type="link"
              icon={<CalendarOutlined />}
              size="small"
              onClick={() => handleAddEvent(record)}
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
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditCase(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  // 获取诉讼案件列表
  const fetchLitigationCases = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await litigationService.getLitigationList({
        page: 1,
        size: 50
      })
      const cases = response?.records || response || []
      setState(prev => ({ 
        ...prev, 
        litigationCases: cases,
        loading: false
      }))
    } catch (error) {
      message.error('获取诉讼案件失败')
      setState(prev => ({ ...prev, loading: false, litigationCases: [] }))
    }
  }

  // 获取诉讼统计
  const fetchLitigationStats = async () => {
    try {
      const response = await litigationService.getLitigationStats()
      const stats = response?.data || {}
      setState(prev => ({
        ...prev,
        statsData: {
          totalCases: 0,
          preparationCount: 0,
          filingCount: 0,
          trialCount: 0,
          executionCount: 0,
          completedCount: 0,
          totalDebtAmount: 0,
          totalRecoveredAmount: 0,
          recoveryRate: 0,
          avgProcessTime: 0,
          ...stats
        }
      }))
    } catch (error) {
      message.error('获取诉讼统计失败')
    }
  }

  // 查看案件详情
  const handleViewCase = async (record: LitigationCase) => {
    setState(prev => ({ ...prev, currentCase: record }))
    setIsDetailModalVisible(true)
    
    // 加载法院事件
    try {
      const response = await litigationService.getCourtEvents(record.id)
      const events = response?.data || []
      setState(prev => ({ ...prev, courtEvents: events }))
    } catch (error) {
      message.error('获取法院事件失败')
    }
  }

  // 添加法院事件
  const handleAddEvent = (record: LitigationCase) => {
    setState(prev => ({ ...prev, currentCase: record }))
    eventForm.resetFields()
    setIsEventModalVisible(true)
  }

  // 生成文书
  const handleGenerateDocument = async (record: LitigationCase) => {
    setState(prev => ({ ...prev, currentCase: record }))
    documentForm.resetFields()
    setIsDocumentModalVisible(true)
    
    // 加载文书模板
    try {
      const response = await litigationService.getDocumentTemplates()
      const templates = response?.data || []
      setState(prev => ({ ...prev, documentTemplates: templates }))
    } catch (error) {
      message.error('获取文书模板失败')
    }
  }

  // 保存法院事件
  const handleSaveEvent = async () => {
    try {
      const values = await eventForm.validateFields()
      
      if (!state.currentCase) {
        message.error('请选择案件')
        return
      }

      // 处理日期格式
      const eventData = {
        ...values,
        scheduledTime: values.scheduledTime ? values.scheduledTime.format('YYYY-MM-DD HH:mm:ss') : null
      }

      await litigationService.addCourtEvent(state.currentCase.id, eventData)
      
      message.success('法院事件添加成功')
      setIsEventModalVisible(false)
      
      // 如果当前在查看案件详情，刷新事件列表
      if (isDetailModalVisible) {
        const response = await litigationService.getCourtEvents(state.currentCase.id)
        const events = response?.data || []
        setState(prev => ({ ...prev, courtEvents: events }))
      }
    } catch (error) {
      message.error('添加法院事件失败')
    }
  }

  // 保存生成文书
  const handleSaveDocument = async () => {
    try {
      const values = await documentForm.validateFields()
      
      if (!state.currentCase) {
        message.error('请选择案件')
        return
      }

      // 构建文书生成参数
      const documentData = {
        templateId: values.templateId,
        name: values.name,
        type: values.type,
        enableSignature: values.enableSignature || false,
        description: values.description,
        // 自动填充案件变量
        variables: {
          caseNumber: state.currentCase.caseNumber,
          borrowerName: state.currentCase.borrowerName,
          debtAmount: state.currentCase.debtAmount,
          courtName: state.currentCase.courtName,
          judgeName: state.currentCase.judgeName || '',
          currentDate: dayjs().format('YYYY年MM月DD日')
        }
      }

      const response = await litigationService.generateDocument(state.currentCase.id, documentData)
      
      message.success('文书生成成功')
      setIsDocumentModalVisible(false)
      
      // 提示下载
      if (response?.data?.downloadUrl) {
        message.info('文书已生成，可在案件详情中查看和下载')
      }
    } catch (error) {
      message.error('生成文书失败')
    }
  }

  // 快速创建模板
  const handleQuickCreateTemplate = () => {
    try {
      templateForm.resetFields()
      setUploadMode(false)
      setIsTemplateModalVisible(true)
    } catch (error) {
      console.error('打开模板弹窗失败:', error)
      message.error('打开模板弹窗失败')
    }
  }

  // 关闭模板弹窗
  const handleCloseTemplateModal = () => {
    try {
      setIsTemplateModalVisible(false)
      setUploadMode(false)
      templateForm.resetFields()
    } catch (error) {
      console.error('关闭模板弹窗失败:', error)
    }
  }

  // 保存新建模板
  const handleSaveTemplate = async () => {
    try {
      const values = await templateForm.validateFields()
      
      const templateData = {
        name: values.name,
        type: values.type,
        description: values.description,
        content: values.content,
        variables: values.variables ? values.variables.split(',').map(v => v.trim()).filter(v => v) : [],
        category: values.category || 'litigation',
        fileType: values.fileType || 'docx'
      }

      const response = await litigationService.createDocumentTemplate(templateData)
      
      message.success('模板创建成功')
      handleCloseTemplateModal() // 使用统一的关闭函数
      
      // 刷新模板列表
      const templatesResponse = await litigationService.getDocumentTemplates()
      const templates = templatesResponse?.data || []
      setState(prev => ({ ...prev, documentTemplates: templates }))
      
      // 自动选择新创建的模板
      if (response?.data?.id) {
        documentForm.setFieldsValue({ templateId: response.data.id })
      }
    } catch (error) {
      console.error('创建模板失败:', error)
      message.error('创建模板失败')
    }
  }

  // 刷新模板列表
  const handleRefreshTemplates = async () => {
    try {
      const response = await litigationService.getDocumentTemplates()
      const templates = response?.data || []
      setState(prev => ({ ...prev, documentTemplates: templates }))
      message.success('模板列表已刷新')
    } catch (error) {
      message.error('刷新模板列表失败')
    }
  }

  // 插入变量到模板内容
  const handleInsertVariable = (variable: string) => {
    try {
      const currentValue = templateForm.getFieldValue('content') || ''
      
      // 尝试获取光标位置
      if (templateContentRef.current && 
          templateContentRef.current.resizableTextArea && 
          templateContentRef.current.resizableTextArea.textArea) {
        
        const textArea = templateContentRef.current.resizableTextArea.textArea
        const startPos = textArea.selectionStart || 0
        const endPos = textArea.selectionEnd || 0
        
        const newValue = currentValue.substring(0, startPos) + 
                        '${' + variable + '}' + 
                        currentValue.substring(endPos)
        
        templateForm.setFieldsValue({ content: newValue })
        
        // 延迟设置光标位置
        requestAnimationFrame(() => {
          try {
            const newPos = startPos + variable.length + 3
            textArea.setSelectionRange(newPos, newPos)
            textArea.focus()
          } catch (e) {
            // 忽略光标设置错误
          }
        })
      } else {
        // 简单追加到末尾
        const newValue = currentValue + (currentValue ? '\n' : '') + '${' + variable + '}'
        templateForm.setFieldsValue({ content: newValue })
      }
      
      message.success(`已插入变量: \${${variable}}`)
    } catch (error) {
      console.error('插入变量时出错:', error)
      message.error('插入变量失败')
    }
  }

  // 处理文件上传模式切换
  const handleUploadModeChange = (e: any) => {
    setUploadMode(e.target.value)
    if (e.target.value) {
      // 切换到上传模式，清空手动输入的内容
      templateForm.setFieldsValue({ content: '' })
    }
  }

  // 处理文件上传
  const handleFileUpload = (info: any) => {
    const { status, originFileObj } = info.file
    
    if (status === 'uploading') {
      return
    }
    
    if (status === 'done' || status === 'removed') {
      if (originFileObj) {
        // 模拟文件解析过程
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          // 这里可以根据文件类型进行不同的解析
          let parsedContent = ''
          
          if (originFileObj.type === 'text/html') {
            // HTML文件解析
            parsedContent = content.replace(/<[^>]*>/g, '').trim()
          } else {
            // 其他文件类型的简单处理
            parsedContent = `已上传文件: ${originFileObj.name}\n\n模板内容将从文件中解析...\n\n可用变量:\n\${caseNumber} - 案件编号\n\${borrowerName} - 借款人姓名\n\${debtAmount} - 债务金额\n\${courtName} - 法院名称\n\${currentDate} - 当前日期`
          }
          
          templateForm.setFieldsValue({ content: parsedContent })
          message.success('文件上传成功，内容已解析')
        }
        reader.readAsText(originFileObj)
      }
    }
    
    if (status === 'error') {
      message.error('文件上传失败')
    }
  }

  // 编辑案件
  const handleEditCase = (record: LitigationCase) => {
    setState(prev => ({ ...prev, currentCase: record }))
    // 设置表单初始值
    editForm.setFieldsValue({
      ...record,
      filingDate: record.filingDate ? dayjs(record.filingDate) : null,
      trialDate: record.trialDate ? dayjs(record.trialDate) : null,
      judgmentDate: record.judgmentDate ? dayjs(record.judgmentDate) : null
    })
    setIsEditModalVisible(true)
  }

  // 保存编辑的案件
  const handleSaveEditCase = async () => {
    try {
      const values = await editForm.validateFields()
      
      if (!state.currentCase) {
        message.error('请选择要编辑的案件')
        return
      }

      // 验证日期逻辑
      const filingDate = values.filingDate
      const trialDate = values.trialDate
      const judgmentDate = values.judgmentDate

      if (filingDate && trialDate && filingDate.isAfter(trialDate)) {
        message.error('立案时间不能晚于开庭时间')
        return
      }

      if (trialDate && judgmentDate && trialDate.isAfter(judgmentDate)) {
        message.error('开庭时间不能晚于判决时间')
        return
      }

      // 验证金额逻辑
      if (values.recoveredAmount && values.judgmentAmount && values.recoveredAmount > values.judgmentAmount) {
        message.error('已回收金额不能大于判决金额')
        return
      }

      // 处理日期格式
      const editData = {
        ...values,
        filingDate: values.filingDate ? values.filingDate.format('YYYY-MM-DD') : null,
        trialDate: values.trialDate ? values.trialDate.format('YYYY-MM-DD HH:mm:ss') : null,
        judgmentDate: values.judgmentDate ? values.judgmentDate.format('YYYY-MM-DD') : null
      }

      await litigationService.updateLitigation(state.currentCase.id, editData)
      
      message.success('诉讼案件更新成功')
      setIsEditModalVisible(false)
      fetchLitigationCases() // 刷新列表
    } catch (error) {
      message.error('更新诉讼案件失败')
    }
  }

  // 新建诉讼案件
  const handleCreateLitigation = async () => {
    setIsCreateModalVisible(true)
    createForm.resetFields()
    
    // 加载可转诉讼的调解案件
    try {
      const response = await litigationService.getAvailableMediationCases({
        page: 1,
        size: 50
      })
      setAvailableMediationCases(response?.records || [])
    } catch (error) {
      message.error('获取可转诉讼案件失败')
    }
  }

  // 保存诉讼案件
  const handleSaveCreateLitigation = async () => {
    try {
      const values = await createForm.validateFields()
      
      const selectedCase = availableMediationCases.find(c => c.id === values.caseId)
      if (!selectedCase) {
        message.error('请选择有效的调解案件')
        return
      }

      await litigationService.createLitigation({
        caseId: selectedCase.caseId,
        caseNumber: selectedCase.caseNumber,
        borrowerName: selectedCase.borrowerName,
        debtAmount: selectedCase.amount,
        courtName: values.courtName,
        plaintiffLawyer: values.plaintiffLawyer,
        caseDescription: values.caseDescription
      })
      
      message.success('诉讼案件创建成功')
      setIsCreateModalVisible(false)
      fetchLitigationCases()
    } catch (error) {
      message.error('创建诉讼案件失败')
    }
  }

  useEffect(() => {
    if (activeTab === 'cases') {
      fetchLitigationCases()
    } else if (activeTab === 'stats') {
      fetchLitigationStats()
    }
  }, [activeTab])

  useEffect(() => {
    fetchLitigationCases()
    fetchLitigationStats()
  }, [])

  return (
    <div>
      <PageHeader
        title="诉讼管理"
        subtitle="跟踪诉讼进度、管理法律文书和执行监控"
        showRefresh
      />
      
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        {/* 诉讼案件管理 */}
        <TabPane tab="诉讼案件" key="cases">
          {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总案件数"
                  value={state.statsData.totalCases}
                  prefix={<BankOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="审理中"
                  value={state.statsData.trialCount}
                  prefix={<PlayCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="执行中"
                  value={state.statsData.executionCount}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="回收率"
                  value={(state.statsData.recoveryRate * 100).toFixed(1)}
                  suffix="%"
                  prefix={<DollarOutlined />}
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
                onClick={fetchLitigationCases}
              >
                刷新
              </Button>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateLitigation}
              >
                新建诉讼
              </Button>
            </Space>
          </Card>

          {/* 诉讼案件列表 */}
          <Card title="诉讼案件列表">
            <Table
              columns={caseColumns}
              dataSource={state.litigationCases}
              rowKey="id"
              loading={state.loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1600 }}
            />
          </Card>
        </TabPane>

        {/* 诉讼统计 */}
        <TabPane tab="诉讼统计" key="stats">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="总诉讼案件"
                  value={state.statsData.totalCases}
                  prefix={<BankOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="债务总金额"
                  value={state.statsData.totalDebtAmount}
                  formatter={(value) => `¥${Number(value).toLocaleString()}`}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="已回收金额"
                  value={state.statsData.totalRecoveredAmount}
                  formatter={(value) => `¥${Number(value).toLocaleString()}`}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card title="诉讼阶段分布">
                <div style={{ padding: '20px' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="诉前准备" value={state.statsData.preparationCount} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="立案审查" value={state.statsData.filingCount} />
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      <Statistic title="开庭审理" value={state.statsData.trialCount} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="强制执行" value={state.statsData.executionCount} />
                    </Col>
                  </Row>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="执行效率">
                <div style={{ padding: '20px' }}>
                  <Statistic
                    title="平均处理时间"
                    value={state.statsData.avgProcessTime}
                    suffix="天"
                    prefix={<ClockCircleOutlined />}
                    style={{ marginBottom: 16 }}
                  />
                  <Progress
                    type="circle"
                    percent={(state.statsData.recoveryRate * 100)}
                    format={(percent) => `${percent?.toFixed(1)}%`}
                    width={100}
                  />
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Text type="secondary">债务回收率</Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* 案件详情弹窗 */}
      <Modal
        title="诉讼案件详情"
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
              <Descriptions.Item label="债务金额">{formatCurrency(state.currentCase.debtAmount)}</Descriptions.Item>
              <Descriptions.Item label="法院">{state.currentCase.courtName}</Descriptions.Item>
              <Descriptions.Item label="法院案号">{state.currentCase.courtCaseNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="承办法官">{state.currentCase.judgeName || '-'}</Descriptions.Item>
              <Descriptions.Item label="代理律师">{state.currentCase.plaintiffLawyer || '-'}</Descriptions.Item>
              <Descriptions.Item label="立案时间">{state.currentCase.filingDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="开庭时间">{state.currentCase.trialDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="判决时间">{state.currentCase.judgmentDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="判决金额">
                {state.currentCase.judgmentAmount ? formatCurrency(state.currentCase.judgmentAmount) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="已回收金额">
                {state.currentCase.recoveredAmount ? formatCurrency(state.currentCase.recoveredAmount) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="案件描述" span={2}>{state.currentCase.caseDescription || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{state.currentCase.remarks || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider>法院事件</Divider>
            {state.courtEvents.length > 0 ? (
              <Timeline>
                {state.courtEvents.map((event) => (
                  <Timeline.Item key={event.id}>
                    <div>
                      <Text strong>{event.title}</Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        {event.scheduledTime}
                      </Text>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Text>{event.description}</Text>
                    </div>
                    {event.result && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="success">结果：{event.result}</Text>
                      </div>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="暂无法院事件" />
            )}
          </div>
        )}
      </Modal>

      {/* 新建诉讼案件弹窗 */}
      <Modal
        title="新建诉讼案件"
        open={isCreateModalVisible}
        onOk={handleSaveCreateLitigation}
        onCancel={() => setIsCreateModalVisible(false)}
        width={600}
        okText="创建"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="caseId"
            label="选择调解失败案件"
            rules={[{ required: true, message: '请选择调解失败案件' }]}
          >
            <Select placeholder="请选择要转入诉讼的调解案件">
              {availableMediationCases.map(caseItem => (
                <Option key={caseItem.id} value={caseItem.id}>
                  {caseItem.caseNumber} - {caseItem.borrowerName} - {formatCurrency(caseItem.amount)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="courtName"
            label="受理法院"
            rules={[{ required: true, message: '请输入受理法院' }]}
          >
            <Input placeholder="请输入受理法院名称" />
          </Form.Item>

          <Form.Item
            name="plaintiffLawyer"
            label="代理律师"
          >
            <Input placeholder="请输入代理律师姓名" />
          </Form.Item>

          <Form.Item
            name="caseDescription"
            label="案件描述"
          >
            <TextArea rows={3} placeholder="请输入案件描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑诉讼案件弹窗 */}
      <Modal
        title="编辑诉讼案件"
        open={isEditModalVisible}
        onOk={handleSaveEditCase}
        onCancel={() => setIsEditModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="courtName"
                label="受理法院"
                rules={[{ required: true, message: '请输入受理法院' }]}
              >
                <Input placeholder="请输入受理法院名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="courtCaseNumber"
                label="法院案号"
              >
                <Input placeholder="请输入法院案号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="judgeName"
                label="承办法官"
              >
                <Input placeholder="请输入承办法官姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="plaintiffLawyer"
                label="代理律师"
              >
                <Input placeholder="请输入代理律师姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="filingDate"
                label="立案时间"
              >
                <DatePicker placeholder="请选择立案时间" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="trialDate"
                label="开庭时间"
              >
                <DatePicker 
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="请选择开庭时间" 
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="judgmentDate"
                label="判决时间"
              >
                <DatePicker placeholder="请选择判决时间" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="status"
                label="诉讼状态"
              >
                <Select placeholder="请选择诉讼状态">
                  <Option value={0}>诉前准备</Option>
                  <Option value={1}>立案审查</Option>
                  <Option value={2}>审理中</Option>
                  <Option value={3}>执行中</Option>
                  <Option value={4}>已结案</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stage"
                label="诉讼阶段"
              >
                <Select placeholder="请选择诉讼阶段">
                  <Option value={0}>诉前准备</Option>
                  <Option value={1}>立案审查</Option>
                  <Option value={2}>开庭审理</Option>
                  <Option value={3}>判决生效</Option>
                  <Option value={4}>强制执行</Option>
                  <Option value={5}>执行完毕</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="executionCourt"
                label="执行法院"
              >
                <Input placeholder="请输入执行法院" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="judgmentAmount"
                label="判决金额"
              >
                <InputNumber
                  placeholder="请输入判决金额"
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="recoveredAmount"
                label="已回收金额"
              >
                <InputNumber
                  placeholder="请输入已回收金额"
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="caseDescription"
            label="案件描述"
          >
            <TextArea rows={3} placeholder="请输入案件描述" />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="备注"
          >
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加法院事件弹窗 */}
      <Modal
        title="添加法院事件"
        open={isEventModalVisible}
        onOk={handleSaveEvent}
        onCancel={() => setIsEventModalVisible(false)}
        width={600}
        okText="添加"
        cancelText="取消"
      >
        <Form form={eventForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="事件类型"
                rules={[{ required: true, message: '请选择事件类型' }]}
              >
                <Select placeholder="请选择事件类型">
                  <Option value="hearing">开庭审理</Option>
                  <Option value="mediation">庭前调解</Option>
                  <Option value="evidence">证据交换</Option>
                  <Option value="judgment">宣读判决</Option>
                  <Option value="execution">执行事项</Option>
                  <Option value="other">其他事件</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="事件状态"
                rules={[{ required: true, message: '请选择事件状态' }]}
              >
                <Select placeholder="请选择事件状态">
                  <Option value="scheduled">已安排</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="cancelled">已取消</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="title"
            label="事件标题"
            rules={[{ required: true, message: '请输入事件标题' }]}
          >
            <Input placeholder="请输入事件标题" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="scheduledTime"
                label="安排时间"
                rules={[{ required: true, message: '请选择安排时间' }]}
              >
                <DatePicker 
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="请选择安排时间" 
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="地点"
              >
                <Input placeholder="请输入地点" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="事件描述"
            rules={[{ required: true, message: '请输入事件描述' }]}
          >
            <TextArea rows={3} placeholder="请输入事件描述" />
          </Form.Item>

          <Form.Item
            name="result"
            label="事件结果"
          >
            <TextArea rows={2} placeholder="事件完成后填写结果（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 生成文书弹窗 */}
      <Modal
        title="生成诉讼文书"
        open={isDocumentModalVisible}
        onOk={handleSaveDocument}
        onCancel={() => setIsDocumentModalVisible(false)}
        width={700}
        okText="生成"
        cancelText="取消"
      >
        <Form form={documentForm} layout="vertical">
          <Form.Item
            name="templateId"
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>选择文书模板</span>
                <Button 
                  type="link" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={handleQuickCreateTemplate}
                  style={{ padding: 0, height: 'auto' }}
                >
                  新建模板
                </Button>
                <Button 
                  type="link" 
                  size="small" 
                  icon={<ReloadOutlined />}
                  onClick={handleRefreshTemplates}
                  style={{ padding: 0, height: 'auto' }}
                >
                  刷新
                </Button>
              </div>
            }
            rules={[{ required: true, message: '请选择文书模板' }]}
          >
            <Select 
              placeholder="请选择要使用的文书模板"
              showSearch
              filterOption={(input, option) =>
                (option?.children as any)?.props?.children?.[0]?.props?.children
                  ?.toLowerCase()
                  ?.includes(input.toLowerCase())
              }
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Space style={{ padding: '0 8px 4px' }}>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      size="small"
                      onClick={handleQuickCreateTemplate}
                    >
                      新建模板
                    </Button>
                    <Button 
                      icon={<ReloadOutlined />} 
                      size="small"
                      onClick={handleRefreshTemplates}
                    >
                      刷新列表
                    </Button>
                  </Space>
                </div>
              )}
            >
              {state.documentTemplates.length === 0 ? (
                <Option disabled value="">
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <div>暂无模板</div>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={handleQuickCreateTemplate}
                    >
                      点击创建新模板
                    </Button>
                  </div>
                </Option>
              ) : (
                state.documentTemplates.map(template => (
                  <Option key={template.id} value={template.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{template.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {template.description}
                        </div>
                      </div>
                      <Space>
                        <Tag color="blue">{template.type}</Tag>
                        <Tag color="green">{template.category}</Tag>
                      </Space>
                    </div>
                  </Option>
                ))
              )}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="文书名称"
                rules={[{ required: true, message: '请输入文书名称' }]}
              >
                <Input placeholder="请输入生成的文书名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="文书类型"
                rules={[{ required: true, message: '请选择文书类型' }]}
              >
                <Select placeholder="请选择文书类型">
                  <Option value="complaint">起诉状</Option>
                  <Option value="mediation">调解书</Option>
                  <Option value="judgment">判决书</Option>
                  <Option value="execution">执行书</Option>
                  <Option value="notice">通知书</Option>
                  <Option value="other">其他文书</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="enableSignature"
            label="电子签章"
            valuePropName="checked"
          >
            <Radio.Group>
              <Radio value={true}>启用电子签章</Radio>
              <Radio value={false}>不使用签章</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="variables"
            label="模板变量"
          >
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: '6px', 
              padding: '12px',
              backgroundColor: '#fafafa'
            }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                系统将自动填入以下变量：案件编号、当事人信息、债务金额、法院信息等
              </Text>
              <div style={{ marginTop: '8px' }}>
                <Tag>{'${caseNumber}'}</Tag>
                <Tag>{'${borrowerName}'}</Tag>
                <Tag>{'${debtAmount}'}</Tag>
                <Tag>{'${courtName}'}</Tag>
                <Tag>{'${judgeName}'}</Tag>
                <Tag>{'${currentDate}'}</Tag>
              </div>
            </div>
          </Form.Item>

          <Form.Item
            name="description"
            label="备注说明"
          >
            <TextArea rows={2} placeholder="请输入生成文书的备注说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建模板弹窗 - 优化版 */}
      <Modal
        title="新建文书模板"
        open={isTemplateModalVisible}
        onOk={handleSaveTemplate}
        onCancel={handleCloseTemplateModal}
        width={900}
        style={{ top: 20 }}
        bodyStyle={{ 
          maxHeight: 'calc(100vh - 200px)', 
          overflowY: 'auto',
          padding: '20px'
        }}
        confirmLoading={state.loading}
        okText="创建模板"
        cancelText="取消"
      >
        <Form form={templateForm} layout="vertical">
          {/* 基本信息区域 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="模板名称"
                rules={[{ required: true, message: '请输入模板名称' }]}
              >
                <Input placeholder="请输入模板名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="type"
                label="模板类型"
                rules={[{ required: true, message: '请选择模板类型' }]}
              >
                <Select placeholder="请选择模板类型">
                  <Option value="complaint">起诉状</Option>
                  <Option value="mediation">调解书</Option>
                  <Option value="judgment">判决书</Option>
                  <Option value="execution">执行书</Option>
                  <Option value="notice">通知书</Option>
                  <Option value="summons">传票</Option>
                  <Option value="appeal">上诉状</Option>
                  <Option value="other">其他文书</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="模板分类"
                rules={[{ required: true, message: '请选择模板分类' }]}
              >
                <Select placeholder="请选择模板分类">
                  <Option value="litigation">诉讼类</Option>
                  <Option value="mediation">调解类</Option>
                  <Option value="execution">执行类</Option>
                  <Option value="notice">通知类</Option>
                  <Option value="contract">合同类</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fileType"
                label="文件格式"
                rules={[{ required: true, message: '请选择文件格式' }]}
              >
                <Select placeholder="请选择文件格式">
                  <Option value="docx">Word文档 (.docx)</Option>
                  <Option value="pdf">PDF文档 (.pdf)</Option>
                  <Option value="html">网页格式 (.html)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="description"
                label="模板描述"
              >
                <Input placeholder="请输入模板的简要描述" />
              </Form.Item>
            </Col>
          </Row>

          {/* 内容输入方式选择 */}
          <Form.Item label="内容输入方式">
            <Radio.Group value={uploadMode} onChange={handleUploadModeChange}>
              <Radio value={false}>手动输入模板内容</Radio>
              <Radio value={true}>上传模板文件</Radio>
            </Radio.Group>
          </Form.Item>

          <Row gutter={16}>
            {/* 左侧：模板内容输入 */}
            <Col span={16}>
              {!uploadMode ? (
                <Form.Item
                  name="content"
                  label="模板内容"
                  rules={[{ required: true, message: '请输入模板内容' }]}
                >
                  <TextArea 
                    ref={templateContentRef}
                    rows={12} 
                    placeholder="请输入模板内容，可点击右侧变量快速插入..."
                    style={{ fontSize: '14px', lineHeight: '1.6' }}
                  />
                </Form.Item>
              ) : (
                <Form.Item label="上传模板文件">
                  <Upload.Dragger
                    accept=".docx,.doc,.pdf,.html,.htm,.txt"
                    beforeUpload={() => false}
                    onChange={handleFileUpload}
                    maxCount={1}
                    showUploadList={{
                      showPreviewIcon: false,
                      showDownloadIcon: false,
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                    <p className="ant-upload-hint">
                      支持 .docx, .pdf, .html, .txt 格式的模板文件
                    </p>
                  </Upload.Dragger>
                  
                  {uploadMode && (
                    <Form.Item
                      name="content"
                      style={{ marginTop: '16px' }}
                      rules={[{ required: true, message: '请上传文件或输入内容' }]}
                    >
                      <TextArea 
                        rows={8} 
                        placeholder="文件上传后解析的内容将显示在这里，您也可以手动编辑..."
                        style={{ fontSize: '14px', lineHeight: '1.6' }}
                      />
                    </Form.Item>
                  )}
                </Form.Item>
              )}
            </Col>

            {/* 右侧：可用变量 */}
            <Col span={8}>
              <Form.Item label="可用变量（点击插入）">
                <div style={{ 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px', 
                  padding: '12px',
                  backgroundColor: '#f6f8fa',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
                    点击下方变量可快速插入到模板内容中：
                  </Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { key: 'caseNumber', label: '案件编号', color: 'blue' },
                      { key: 'borrowerName', label: '借款人姓名', color: 'green' },
                      { key: 'borrowerIdCard', label: '借款人身份证', color: 'orange' },
                      { key: 'debtAmount', label: '债务金额', color: 'purple' },
                      { key: 'courtName', label: '法院名称', color: 'cyan' },
                      { key: 'judgeName', label: '法官姓名', color: 'red' },
                      { key: 'clientName', label: '委托方名称', color: 'gold' },
                      { key: 'debtorPhone', label: '债务人电话', color: 'lime' },
                      { key: 'currentDate', label: '当前日期', color: 'magenta' },
                      { key: 'trialDate', label: '开庭日期', color: 'volcano' },
                      { key: 'courtroom', label: '法庭', color: 'geekblue' }
                    ].map(variable => (
                      <Tag 
                        key={variable.key}
                        color={variable.color} 
                        style={{ 
                          margin: '2px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontSize: '12px',
                          padding: '4px 8px'
                        }}
                        onClick={() => handleInsertVariable(variable.key)}
                      >
                        ${variable.key} - {variable.label}
                      </Tag>
                    ))}
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <Alert 
                    message="使用提示" 
                    description="变量格式为 ${变量名}，系统会自动替换为实际值。" 
                    type="info" 
                    showIcon 
                    size="small"
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default LitigationManagement