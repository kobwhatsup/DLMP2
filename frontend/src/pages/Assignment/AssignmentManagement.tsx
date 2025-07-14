import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Table,
  message,
  Form,
  Select,
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
  Typography
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Case, AssignmentTask, MediationCenter, Mediator } from '@/types'
import { assignmentService, caseService } from '@/services'
import StatusTag from '@/components/Common/StatusTag'
import { formatDateTime, formatCurrency } from '@/utils'

const { Option } = Select
const { Step } = Steps
const { TabPane } = Tabs
const { RangePicker } = DatePicker
const { Text } = Typography

interface AssignmentState {
  pendingCases: Case[]
  assignmentTasks: AssignmentTask[]
  mediationCenters: MediationCenter[]
  mediators: Mediator[]
  loading: boolean
  executing: boolean
  currentTask: AssignmentTask | null
}

interface AssignmentConfig {
  strategy: 'rule_based' | 'load_balance' | 'random' | 'manual' | 'region_based' | 'amount_based' | 'age_based' | 'client_based'
  batchSize: number
  maxCasesPerMediator: number
  mediationCenterIds: number[]
  mediatorIds: number[]
  enableAutoAssignment: boolean
  // 地区分案配置
  regionConfig?: {
    enableRegionMatch: boolean
    crossRegionAllowed: boolean
    preferLocalMediator: boolean
  }
  // 金额分案配置
  amountConfig?: {
    smallAmountLimit: number
    largeAmountLimit: number
    amountBasedWeighting: boolean
  }
  // 账龄分案配置
  ageConfig?: {
    newCaseThreshold: number  // 新案件天数阈值（如30天）
    oldCaseThreshold: number  // 老案件天数阈值（如180天）
    prioritizeNewCases: boolean
  }
  // 客户分案配置
  clientConfig?: {
    enableClientSpecialization: boolean
    clientMediatorMapping: Array<{
      clientId: number
      preferredMediatorIds: number[]
    }>
  }
}

const AssignmentManagement: React.FC = () => {
  const [state, setState] = useState<AssignmentState>({
    pendingCases: [],
    assignmentTasks: [],
    mediationCenters: [],
    mediators: [],
    loading: false,
    executing: false,
    currentTask: null
  })
  
  const [config, setConfig] = useState<AssignmentConfig>({
    strategy: 'rule_based',
    batchSize: 100,
    maxCasesPerMediator: 50,
    mediationCenterIds: [],
    mediatorIds: [],
    enableAutoAssignment: false,
    regionConfig: {
      enableRegionMatch: true,
      crossRegionAllowed: false,
      preferLocalMediator: true
    },
    amountConfig: {
      smallAmountLimit: 10000,
      largeAmountLimit: 100000,
      amountBasedWeighting: true
    },
    ageConfig: {
      newCaseThreshold: 30,
      oldCaseThreshold: 180,
      prioritizeNewCases: true
    },
    clientConfig: {
      enableClientSpecialization: false,
      clientMediatorMapping: []
    }
  })
  
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false)
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false)
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [assignmentHistory, setAssignmentHistory] = useState<Array<{
    id: number
    caseId: number
    caseNumber: string
    borrowerName: string
    fromStatus: string
    toStatus: string
    mediatorId: number
    mediatorName: string
    mediationCenterId: number
    mediationCenterName: string
    assignmentReason: string
    assignmentTime: string
    executionTime: number
    status: 'success' | 'failed'
    errorMessage?: string
  }>>([])
  const [statsData, setStatsData] = useState<{
    totalAssigned: number
    successRate: number
    avgAssignTime: number
    todayAssigned: number
    ruleEffectiveness: Array<{
      ruleId: number
      ruleName: string
      executeCount: number
      successRate: number
    }>
    mediatorDistribution: Array<{
      mediatorId: number
      mediatorName: string
      assignedCount: number
      workloadRate: number
    }>
  }>({
    totalAssigned: 0,
    successRate: 0,
    avgAssignTime: 0,
    todayAssigned: 0,
    ruleEffectiveness: [],
    mediatorDistribution: []
  })
  const [previewData, setPreviewData] = useState<Array<{
    caseId: number
    caseNumber: string
    borrowerName: string
    amount: number
    suggestedMediatorId: number
    suggestedMediatorName: string
    confidence: number
    reason: string
  }>>([])
  const [form] = Form.useForm()

  // 待分案案件表格列
  const caseColumns: ColumnsType<Case> = [
    {
      title: '案件编号',
      dataIndex: 'caseNo',
      key: 'caseNo',
      width: 140
    },
    {
      title: '借款人',
      dataIndex: 'debtorName',
      key: 'debtorName',
      width: 100
    },
    {
      title: '债务金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => formatCurrency(amount || 0)
    },
    {
      title: '状态',
      dataIndex: 'caseStatus',
      key: 'caseStatus',
      width: 100,
      render: (status: number) => (
        <Tag color={status === 1 ? 'orange' : status === 2 ? 'blue' : 'green'}>
          {status === 1 ? '待分案' : status === 2 ? '调解中' : '已结案'}
        </Tag>
      )
    },
    {
      title: '委托机构',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 150,
      ellipsis: true
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => formatDateTime(time)
    }
  ]

  // 分案任务表格列
  const taskColumns: ColumnsType<AssignmentTask> = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '分案策略',
      dataIndex: 'strategy',
      key: 'strategy',
      width: 120,
      render: (strategy: string) => {
        const strategyMap = {
          rule_based: '规则引擎',
          load_balance: '负载均衡',
          random: '随机分配',
          manual: '手动分配',
          region_based: '地区分案',
          amount_based: '金额分案',
          age_based: '账龄分案',
          client_based: '客户分案'
        }
        return strategyMap[strategy as keyof typeof strategyMap] || strategy
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'default', text: '等待中' },
          running: { color: 'processing', text: '执行中' },
          completed: { color: 'success', text: '已完成' },
          failed: { color: 'error', text: '已失败' },
          cancelled: { color: 'warning', text: '已取消' }
        }
        const statusInfo = statusMap[status as keyof typeof statusMap]
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      )
    },
    {
      title: '成功/总数',
      key: 'result',
      width: 100,
      render: (_, record) => `${record.successCount || 0}/${record.totalCount || 0}`
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => formatDateTime(time)
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewTask(record)}
            />
          </Tooltip>
          {record.status === 'running' && (
            <Tooltip title="暂停">
              <Button
                type="link"
                icon={<PauseCircleOutlined />}
                size="small"
                onClick={() => handlePauseTask(record.id)}
              />
            </Tooltip>
          )}
          {record.status === 'pending' && (
            <Tooltip title="启动">
              <Button
                type="link"
                icon={<PlayCircleOutlined />}
                size="small"
                onClick={() => handleStartTask(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  // 获取待分案案件
  const fetchPendingCases = async () => {
    try {
      const response = await caseService.getCaseList({
        status: 1, // 待分案状态
        page: 1,
        size: 1000
      })
      const cases = response?.records || response || []
      setState(prev => ({ ...prev, pendingCases: cases }))
    } catch (error) {
      message.error('获取待分案案件失败')
      setState(prev => ({ ...prev, pendingCases: [] }))
    }
  }

  // 获取分案任务
  const fetchAssignmentTasks = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await assignmentService.getTaskList({
        page: 1,
        size: 50
      })
      const tasks = response?.records || response || []
      setState(prev => ({ 
        ...prev, 
        assignmentTasks: tasks,
        loading: false
      }))
    } catch (error) {
      message.error('获取分案任务失败')
      setState(prev => ({ ...prev, loading: false, assignmentTasks: [] }))
    }
  }

  // 获取调解中心列表
  const fetchMediationCenters = async () => {
    try {
      const response = await assignmentService.getMediationCenters()
      const centers = response || []
      setState(prev => ({ ...prev, mediationCenters: centers }))
    } catch (error) {
      message.error('获取调解中心列表失败')
      setState(prev => ({ ...prev, mediationCenters: [] }))
    }
  }

  // 获取调解员列表
  const fetchMediators = async () => {
    try {
      const response = await assignmentService.getMediators()
      const mediators = response || []
      setState(prev => ({ ...prev, mediators: mediators }))
    } catch (error) {
      message.error('获取调解员列表失败')
      setState(prev => ({ ...prev, mediators: [] }))
    }
  }

  // 开始智能分案
  const handleStartAssignment = async () => {
    if (state.pendingCases.length === 0) {
      message.warning('暂无待分案案件')
      return
    }

    setState(prev => ({ ...prev, executing: true }))
    try {
      const response = await assignmentService.startSmartAssignment(config)
      message.success('智能分案任务已启动')
      fetchAssignmentTasks()
      fetchPendingCases()
    } catch (error) {
      message.error('启动智能分案失败')
    } finally {
      setState(prev => ({ ...prev, executing: false }))
    }
  }

  // 停止分案
  const handleStopAssignment = async () => {
    try {
      await assignmentService.stopAssignment()
      message.success('已停止智能分案')
      fetchAssignmentTasks()
    } catch (error) {
      message.error('停止分案失败')
    }
  }

  // 查看任务详情
  const handleViewTask = (task: AssignmentTask) => {
    setState(prev => ({ ...prev, currentTask: task }))
    setIsTaskModalVisible(true)
  }

  // 暂停任务
  const handlePauseTask = async (taskId: number) => {
    try {
      await assignmentService.pauseTask(taskId)
      message.success('任务已暂停')
      fetchAssignmentTasks()
    } catch (error) {
      message.error('暂停任务失败')
    }
  }

  // 启动任务
  const handleStartTask = async (taskId: number) => {
    try {
      await assignmentService.startTask(taskId)
      message.success('任务已启动')
      fetchAssignmentTasks()
    } catch (error) {
      message.error('启动任务失败')
    }
  }

  // 打开配置弹窗
  const handleOpenConfig = () => {
    form.setFieldsValue(config)
    setIsConfigModalVisible(true)
  }

  // 保存配置
  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields()
      setConfig(values)
      setIsConfigModalVisible(false)
      message.success('配置已保存')
    } catch (error) {
      message.error('请检查表单填写')
    }
  }

  // 分案预览
  const handlePreviewAssignment = async () => {
    if (state.pendingCases.length === 0) {
      message.warning('暂无待分案案件')
      return
    }

    try {
      // 模拟智能分案预览
      const mockPreviewData = state.pendingCases.slice(0, 10).map((caseItem, index) => {
        const mediators = state.mediators
        const randomMediator = mediators[index % mediators.length] || { id: 101, name: '调解员张三' }
        
        return {
          caseId: caseItem.id,
          caseNumber: caseItem.caseNo || `CASE${String(caseItem.id).padStart(6, '0')}`,
          borrowerName: caseItem.debtorName || `债务人${caseItem.id}`,
          amount: caseItem.amount || 50000,
          suggestedMediatorId: randomMediator.id,
          suggestedMediatorName: randomMediator.name,
          confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
          reason: getAssignmentReason(config.strategy, caseItem)
        }
      })
      
      setPreviewData(mockPreviewData)
      setIsPreviewModalVisible(true)
    } catch (error) {
      message.error('生成分案预览失败')
    }
  }

  // 快速分案
  const handleQuickAssignment = async (strategy: string) => {
    const quickConfig = {
      ...config,
      strategy: strategy as typeof config.strategy
    }
    
    setState(prev => ({ ...prev, executing: true }))
    try {
      const response = await assignmentService.startSmartAssignment(quickConfig)
      message.success(`${getStrategyName(strategy)}已启动`)
      fetchAssignmentTasks()
      fetchPendingCases()
    } catch (error) {
      message.error('启动分案失败')
    } finally {
      setState(prev => ({ ...prev, executing: false }))
    }
  }

  // 获取分案原因
  const getAssignmentReason = (strategy: string, caseItem: any) => {
    switch (strategy) {
      case 'region_based':
        return '基于债务人地区匹配本地调解员'
      case 'amount_based':
        return `根据案件金额${caseItem.amount || 50000}元分配给专业调解员`
      case 'age_based':
        return '基于案件账龄分配给有经验的调解员'
      case 'load_balance':
        return '根据调解员当前工作量进行负载均衡分配'
      case 'client_based':
        return '基于委托机构专业化分配'
      default:
        return '基于综合规则引擎分配'
    }
  }

  // 获取策略名称
  const getStrategyName = (strategy: string) => {
    const strategyMap = {
      rule_based: '规则引擎分案',
      load_balance: '负载均衡分案',
      region_based: '地区分案',
      amount_based: '金额分案',
      age_based: '账龄分案',
      client_based: '客户分案',
      random: '随机分案',
      manual: '手动分案'
    }
    return strategyMap[strategy as keyof typeof strategyMap] || '智能分案'
  }

  // 获取分案历史
  const fetchAssignmentHistory = async () => {
    try {
      // 模拟分案历史数据
      const mockHistory = [
        {
          id: 1,
          caseId: 1,
          caseNumber: 'DLMP20240101001',
          borrowerName: '张三',
          fromStatus: '待分案',
          toStatus: '调解中',
          mediatorId: 101,
          mediatorName: '调解员张三',
          mediationCenterId: 1,
          mediationCenterName: '北京朝阳调解中心',
          assignmentReason: '基于地区匹配规则分配',
          assignmentTime: '2024-07-13 10:30:15',
          executionTime: 2.5,
          status: 'success' as const
        },
        {
          id: 2,
          caseId: 2,
          caseNumber: 'DLMP20240101002',
          borrowerName: '李四',
          fromStatus: '待分案',
          toStatus: '调解中',
          mediatorId: 102,
          mediatorName: '调解员李四',
          mediationCenterId: 1,
          mediationCenterName: '北京朝阳调解中心',
          assignmentReason: '基于案件金额匹配专业调解员',
          assignmentTime: '2024-07-13 10:30:18',
          executionTime: 1.8,
          status: 'success' as const
        },
        {
          id: 3,
          caseId: 3,
          caseNumber: 'DLMP20240101003',
          borrowerName: '王五',
          fromStatus: '待分案',
          toStatus: '待分案',
          mediatorId: 0,
          mediatorName: '',
          mediationCenterId: 0,
          mediationCenterName: '',
          assignmentReason: '调解员工作量已满',
          assignmentTime: '2024-07-13 10:30:22',
          executionTime: 0.5,
          status: 'failed' as const,
          errorMessage: '没有可用的调解员'
        }
      ]
      setAssignmentHistory(mockHistory)
    } catch (error) {
      message.error('获取分案历史失败')
    }
  }

  // 获取分案统计
  const fetchAssignmentStats = async () => {
    try {
      const response = await assignmentService.getAssignmentStats()
      const stats = response || {}
      setStatsData({
        totalAssigned: 0,
        successRate: 0,
        avgAssignTime: 0,
        todayAssigned: Math.floor(Math.random() * 50) + 20,
        ruleEffectiveness: [],
        mediatorDistribution: [],
        ...stats
      })
    } catch (error) {
      message.error('获取分案统计失败')
      setStatsData({
        totalAssigned: 0,
        successRate: 0,
        avgAssignTime: 0,
        todayAssigned: 0,
        ruleEffectiveness: [],
        mediatorDistribution: []
      })
    }
  }

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchPendingCases()
      fetchAssignmentTasks()
      fetchMediationCenters()
      fetchMediators()
    } else if (activeTab === 'history') {
      fetchAssignmentHistory()
    } else if (activeTab === 'stats') {
      fetchAssignmentStats()
    }
  }, [activeTab])

  useEffect(() => {
    fetchPendingCases()
    fetchAssignmentTasks()
    fetchMediationCenters()
    fetchMediators()
    
    // 设置定时刷新
    const interval = setInterval(() => {
      if (activeTab === 'overview') {
        fetchAssignmentTasks()
        fetchPendingCases()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [activeTab])

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        {/* 智能分案概览 */}
        <TabPane tab="智能分案" key="overview">
          {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="待分案案件"
                  value={state.pendingCases.length}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="正在执行任务"
                  value={state.assignmentTasks.filter(t => t.status === 'running').length}
                  prefix={<PlayCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="今日已分案"
                  value={state.assignmentTasks
                    .filter(t => t.createTime?.startsWith(new Date().toISOString().slice(0, 10)))
                    .reduce((sum, t) => sum + (t.successCount || 0), 0)}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="分案成功率"
                  value={85.6}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between">
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                loading={state.executing}
                onClick={handleStartAssignment}
                size="large"
              >
                一键智能分案
              </Button>
              <Button 
                icon={<EyeOutlined />} 
                onClick={handlePreviewAssignment}
              >
                分案预览
              </Button>
              <Button 
                icon={<PauseCircleOutlined />} 
                onClick={handleStopAssignment}
              >
                停止分案
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<SettingOutlined />} 
                onClick={handleOpenConfig}
              >
                分案配置
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  fetchPendingCases()
                  fetchAssignmentTasks()
                }}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
        
        {/* 快速分案策略选择 */}
        <Divider style={{ margin: '16px 0' }} />
        <Row gutter={16}>
          <Col span={6}>
            <Button 
              block 
              onClick={() => handleQuickAssignment('region_based')}
              icon={<PlayCircleOutlined />}
            >
              按地区分案
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              block 
              onClick={() => handleQuickAssignment('amount_based')}
              icon={<PlayCircleOutlined />}
            >
              按金额分案
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              block 
              onClick={() => handleQuickAssignment('age_based')}
              icon={<PlayCircleOutlined />}
            >
              按账龄分案
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              block 
              onClick={() => handleQuickAssignment('load_balance')}
              icon={<PlayCircleOutlined />}
            >
              负载均衡
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 分案任务列表 */}
      <Card title="分案任务" style={{ marginBottom: 16 }}>
        <Table
          columns={taskColumns}
          dataSource={state.assignmentTasks}
          rowKey="id"
          loading={state.loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>

          {/* 待分案案件 */}
          <Card title="待分案案件">
            <Table
              columns={caseColumns}
              dataSource={state.pendingCases}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </TabPane>

        {/* 分案历史 */}
        <TabPane tab="分案历史" key="history">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="历史分案总数"
                  value={assignmentHistory.length}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="成功分案"
                  value={assignmentHistory.filter(h => h.status === 'success').length}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="失败分案"
                  value={assignmentHistory.filter(h => h.status === 'failed').length}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="分案历史记录" extra={
            <Space>
              <RangePicker placeholder={['开始时间', '结束时间']} />
              <Button icon={<ReloadOutlined />} onClick={fetchAssignmentHistory}>
                刷新
              </Button>
            </Space>
          }>
            <Table
              columns={[
                {
                  title: '案件编号',
                  dataIndex: 'caseNumber',
                  key: 'caseNumber',
                  width: 140
                },
                {
                  title: '借款人',
                  dataIndex: 'borrowerName',
                  key: 'borrowerName',
                  width: 100
                },
                {
                  title: '分案前状态',
                  dataIndex: 'fromStatus',
                  key: 'fromStatus',
                  width: 100,
                  render: (status: string) => <Tag>{status}</Tag>
                },
                {
                  title: '分案后状态',
                  dataIndex: 'toStatus',
                  key: 'toStatus',
                  width: 100,
                  render: (status: string) => <Tag color="blue">{status}</Tag>
                },
                {
                  title: '分配调解员',
                  dataIndex: 'mediatorName',
                  key: 'mediatorName',
                  width: 120,
                  render: (name: string) => name || '-'
                },
                {
                  title: '调解中心',
                  dataIndex: 'mediationCenterName',
                  key: 'mediationCenterName',
                  width: 150,
                  ellipsis: true,
                  render: (name: string) => name || '-'
                },
                {
                  title: '分案原因',
                  dataIndex: 'assignmentReason',
                  key: 'assignmentReason',
                  width: 200,
                  ellipsis: true,
                  render: (reason: string) => (
                    <Tooltip title={reason}>
                      {reason}
                    </Tooltip>
                  )
                },
                {
                  title: '执行时间',
                  dataIndex: 'executionTime',
                  key: 'executionTime',
                  width: 100,
                  render: (time: number) => `${time}秒`
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  width: 80,
                  render: (status: string) => (
                    <Tag color={status === 'success' ? 'green' : 'red'}>
                      {status === 'success' ? '成功' : '失败'}
                    </Tag>
                  )
                },
                {
                  title: '分案时间',
                  dataIndex: 'assignmentTime',
                  key: 'assignmentTime',
                  width: 160,
                  render: (time: string) => formatDateTime(time)
                },
                {
                  title: '错误信息',
                  dataIndex: 'errorMessage',
                  key: 'errorMessage',
                  width: 150,
                  ellipsis: true,
                  render: (error?: string) => error ? (
                    <Tooltip title={error}>
                      <Tag color="red">{error}</Tag>
                    </Tooltip>
                  ) : '-'
                }
              ]}
              dataSource={assignmentHistory}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>

        {/* 分案统计 */}
        <TabPane tab="分案统计" key="stats">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总分案数"
                  value={statsData.totalAssigned}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="分案成功率"
                  value={statsData.successRate * 100}
                  suffix="%"
                  precision={1}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均分案时间"
                  value={statsData.avgAssignTime}
                  suffix="秒"
                  precision={1}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="今日分案"
                  value={statsData.todayAssigned}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card title="规则效果统计">
                <Table
                  columns={[
                    {
                      title: '规则名称',
                      dataIndex: 'ruleName',
                      key: 'ruleName',
                      ellipsis: true
                    },
                    {
                      title: '执行次数',
                      dataIndex: 'executeCount',
                      key: 'executeCount',
                      width: 100
                    },
                    {
                      title: '成功率',
                      dataIndex: 'successRate',
                      key: 'successRate',
                      width: 100,
                      render: (rate: number) => (
                        <span style={{ color: rate >= 0.8 ? '#3f8600' : rate >= 0.6 ? '#fa8c16' : '#cf1322' }}>
                          {(rate * 100).toFixed(1)}%
                        </span>
                      )
                    }
                  ]}
                  dataSource={statsData.ruleEffectiveness}
                  rowKey="ruleId"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="调解员工作量分布">
                <Table
                  columns={[
                    {
                      title: '调解员',
                      dataIndex: 'mediatorName',
                      key: 'mediatorName',
                      ellipsis: true
                    },
                    {
                      title: '分案数量',
                      dataIndex: 'assignedCount',
                      key: 'assignedCount',
                      width: 100
                    },
                    {
                      title: '工作负载',
                      dataIndex: 'workloadRate',
                      key: 'workloadRate',
                      width: 120,
                      render: (rate: number) => (
                        <div>
                          <Progress 
                            percent={rate * 100} 
                            size="small" 
                            status={rate > 0.9 ? 'exception' : rate > 0.7 ? 'normal' : 'success'}
                          />
                          <span style={{ fontSize: '12px' }}>{(rate * 100).toFixed(1)}%</span>
                        </div>
                      )
                    }
                  ]}
                  dataSource={statsData.mediatorDistribution}
                  rowKey="mediatorId"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* 分案配置弹窗 */}
      <Modal
        title="智能分案配置"
        open={isConfigModalVisible}
        onOk={handleSaveConfig}
        onCancel={() => setIsConfigModalVisible(false)}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={config}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="strategy"
                label="分案策略"
                rules={[{ required: true, message: '请选择分案策略' }]}
              >
                <Select placeholder="请选择分案策略">
                  <Option value="rule_based">规则引擎</Option>
                  <Option value="load_balance">负载均衡</Option>
                  <Option value="region_based">地区分案</Option>
                  <Option value="amount_based">金额分案</Option>
                  <Option value="age_based">账龄分案</Option>
                  <Option value="client_based">客户分案</Option>
                  <Option value="random">随机分配</Option>
                  <Option value="manual">手动分配</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="batchSize"
                label="批次大小"
                rules={[{ required: true, message: '请输入批次大小' }]}
              >
                <InputNumber min={1} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maxCasesPerMediator"
                label="调解员最大案件数"
                rules={[{ required: true, message: '请输入最大案件数' }]}
              >
                <InputNumber min={1} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enableAutoAssignment"
                label="启用自动分案"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider>高级配置</Divider>
          
          {/* 地区分案配置 */}
          <Card title="地区分案配置" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name={['regionConfig', 'enableRegionMatch']}
                  label="启用地区匹配"
                  valuePropName="checked"
                >
                  <Switch size="small" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['regionConfig', 'crossRegionAllowed']}
                  label="允许跨地区分案"
                  valuePropName="checked"
                >
                  <Switch size="small" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['regionConfig', 'preferLocalMediator']}
                  label="优先本地调解员"
                  valuePropName="checked"
                >
                  <Switch size="small" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          
          {/* 金额分案配置 */}
          <Card title="金额分案配置" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name={['amountConfig', 'smallAmountLimit']}
                  label="小额案件上限(元)"
                >
                  <InputNumber
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['amountConfig', 'largeAmountLimit']}
                  label="大额案件下限(元)"
                >
                  <InputNumber
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['amountConfig', 'amountBasedWeighting']}
                  label="金额加权分配"
                  valuePropName="checked"
                >
                  <Switch size="small" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          
          {/* 账龄分案配置 */}
          <Card title="账龄分案配置" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name={['ageConfig', 'newCaseThreshold']}
                  label="新案件阈值(天)"
                >
                  <InputNumber min={1} max={365} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['ageConfig', 'oldCaseThreshold']}
                  label="老案件阈值(天)"
                >
                  <InputNumber min={1} max={365} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['ageConfig', 'prioritizeNewCases']}
                  label="优先处理新案件"
                  valuePropName="checked"
                >
                  <Switch size="small" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          
          {/* 客户分案配置 */}
          <Card title="客户分案配置" size="small" style={{ marginBottom: 16 }}>
            <Form.Item
              name={['clientConfig', 'enableClientSpecialization']}
              label="启用客户专业化分案"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Card>
          
          <Form.Item
            name="mediationCenterIds"
            label="限定调解中心"
          >
            <Select
              mode="multiple"
              placeholder="不选择则不限定"
              allowClear
            >
              {state.mediationCenters.map(center => (
                <Option key={center.id} value={center.id}>{center.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="mediatorIds"
            label="限定调解员"
          >
            <Select
              mode="multiple"
              placeholder="不选择则不限定"
              allowClear
            >
              {state.mediators.map(mediator => (
                <Option key={mediator.id} value={mediator.id}>{mediator.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务详情弹窗 */}
      <Modal
        title="任务详情"
        open={isTaskModalVisible}
        onCancel={() => setIsTaskModalVisible(false)}
        footer={null}
        width={800}
      >
        {state.currentTask && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>任务ID:</strong> {state.currentTask.id}</p>
                <p><strong>任务名称:</strong> {state.currentTask.name}</p>
                <p><strong>分案策略:</strong> {state.currentTask.strategy}</p>
              </Col>
              <Col span={12}>
                <p><strong>状态:</strong> {state.currentTask.status}</p>
                <p><strong>进度:</strong> {state.currentTask.progress}%</p>
                <p><strong>成功/总数:</strong> {state.currentTask.successCount}/{state.currentTask.totalCount}</p>
              </Col>
            </Row>
            
            <Divider />
            
            <div>
              <h4>执行步骤</h4>
              <Steps
                direction="vertical"
                size="small"
                current={2}
                items={[
                  {
                    title: '初始化任务',
                    description: '加载待分案案件列表',
                    status: 'finish'
                  },
                  {
                    title: '匹配规则',
                    description: '根据配置的策略匹配分案规则',
                    status: 'finish'
                  },
                  {
                    title: '执行分案',
                    description: '正在执行案件分配...',
                    status: 'process'
                  },
                  {
                    title: '完成任务',
                    description: '所有案件分配完成',
                    status: 'wait'
                  }
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 分案预览弹窗 */}
      <Modal
        title="智能分案预览"
        open={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setIsPreviewModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={() => {
              setIsPreviewModalVisible(false)
              handleStartAssignment()
            }}
          >
            确认执行分案
          </Button>
        ]}
      >
        <Alert
          message="分案预览"
          description={`基于当前配置的"${getStrategyName(config.strategy)}"策略，预计为 ${previewData.length} 个案件分配调解员。`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Table
          columns={[
            {
              title: '案件编号',
              dataIndex: 'caseNumber',
              key: 'caseNumber',
              width: 140
            },
            {
              title: '借款人',
              dataIndex: 'borrowerName',
              key: 'borrowerName',
              width: 100
            },
            {
              title: '案件金额',
              dataIndex: 'amount',
              key: 'amount',
              width: 120,
              render: (amount: number) => `¥${amount.toLocaleString()}`
            },
            {
              title: '建议调解员',
              dataIndex: 'suggestedMediatorName',
              key: 'suggestedMediatorName',
              width: 120
            },
            {
              title: '匹配度',
              dataIndex: 'confidence',
              key: 'confidence',
              width: 100,
              render: (confidence: number) => (
                <div>
                  <Progress 
                    percent={confidence} 
                    size="small" 
                    status={confidence >= 85 ? 'success' : confidence >= 70 ? 'normal' : 'exception'} 
                  />
                  <Text style={{ fontSize: '12px' }}>{confidence}%</Text>
                </div>
              )
            },
            {
              title: '分案原因',
              dataIndex: 'reason',
              key: 'reason',
              ellipsis: true,
              render: (reason: string) => (
                <Tooltip title={reason}>
                  <Text ellipsis style={{ maxWidth: 200 }}>{reason}</Text>
                </Tooltip>
              )
            }
          ]}
          dataSource={previewData}
          rowKey="caseId"
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 800 }}
        />
      </Modal>
    </div>
  )
}

export default AssignmentManagement