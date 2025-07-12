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
  Divider
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Case, AssignmentTask, MediationCenter, Mediator } from '@/types'
import { assignmentService, caseService } from '@/services'
import StatusTag from '@/components/Common/StatusTag'
import { formatDateTime, formatCurrency } from '@/utils'

const { Option } = Select
const { Step } = Steps

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
  strategy: 'rule_based' | 'load_balance' | 'random' | 'manual'
  batchSize: number
  maxCasesPerMediator: number
  mediationCenterIds: number[]
  mediatorIds: number[]
  enableAutoAssignment: boolean
}

const SmartAssignment: React.FC = () => {
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
    enableAutoAssignment: false
  })
  
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false)
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false)
  const [form] = Form.useForm()

  // 待分案案件表格列
  const caseColumns: ColumnsType<Case> = [
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
      title: '债务金额',
      dataIndex: 'debtAmount',
      key: 'debtAmount',
      width: 120,
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: '逾期天数',
      dataIndex: 'overdueDays',
      key: 'overdueDays',
      width: 100,
      render: (days: number) => (
        <Tag color={days > 180 ? 'red' : days > 90 ? 'orange' : 'green'}>
          {days}天
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
          manual: '手动分配'
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
      setState(prev => ({ ...prev, pendingCases: response.data.records }))
    } catch (error) {
      message.error('获取待分案案件失败')
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
      setState(prev => ({ 
        ...prev, 
        assignmentTasks: response.data.records,
        loading: false
      }))
    } catch (error) {
      message.error('获取分案任务失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取调解中心列表
  const fetchMediationCenters = async () => {
    try {
      const response = await assignmentService.getMediationCenters()
      setState(prev => ({ ...prev, mediationCenters: response.data }))
    } catch (error) {
      message.error('获取调解中心列表失败')
    }
  }

  // 获取调解员列表
  const fetchMediators = async () => {
    try {
      const response = await assignmentService.getMediators()
      setState(prev => ({ ...prev, mediators: response.data }))
    } catch (error) {
      message.error('获取调解员列表失败')
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

  useEffect(() => {
    fetchPendingCases()
    fetchAssignmentTasks()
    fetchMediationCenters()
    fetchMediators()
    
    // 设置定时刷新
    const interval = setInterval(() => {
      fetchAssignmentTasks()
      fetchPendingCases()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
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
        <Space>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            loading={state.executing}
            onClick={handleStartAssignment}
          >
            开始智能分案
          </Button>
          <Button 
            icon={<PauseCircleOutlined />} 
            onClick={handleStopAssignment}
          >
            停止分案
          </Button>
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

      {/* 分案配置弹窗 */}
      <Modal
        title="智能分案配置"
        open={isConfigModalVisible}
        onOk={handleSaveConfig}
        onCancel={() => setIsConfigModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
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
    </div>
  )
}

export default SmartAssignment