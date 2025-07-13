import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Modal,
  Row,
  Col,
  Tag,
  Typography,
  Tooltip,
  Popconfirm,
  Badge,
  Tabs
} from 'antd'
import {
  HistoryOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExportOutlined,
  ClearOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  GlobalOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { OperationLog, LoginLog } from '@/types'
import { systemService } from '@/services'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { Text } = Typography
const { TabPane } = Tabs

interface LogState {
  operationLogs: OperationLog[]
  loginLogs: LoginLog[]
  operationLoading: boolean
  loginLoading: boolean
  operationTotal: number
  loginTotal: number
  operationCurrent: number
  loginCurrent: number
  pageSize: number
}

interface LogFilters {
  module?: string
  operation?: string
  status?: string
  userId?: number
  dateRange?: [string, string]
}

const SystemLogsComponent: React.FC = () => {
  const [operationForm] = Form.useForm()
  const [loginForm] = Form.useForm()
  
  const [state, setState] = useState<LogState>({
    operationLogs: [],
    loginLogs: [],
    operationLoading: false,
    loginLoading: false,
    operationTotal: 0,
    loginTotal: 0,
    operationCurrent: 1,
    loginCurrent: 1,
    pageSize: 10
  })

  const [operationFilters, setOperationFilters] = useState<LogFilters>({})
  const [loginFilters, setLoginFilters] = useState<LogFilters>({})
  const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)

  // 操作日志表格列
  const operationColumns: ColumnsType<OperationLog> = [
    {
      title: '操作用户',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
      render: (name: string) => (
        <Space>
          <UserOutlined />
          {name}
        </Space>
      )
    },
    {
      title: '操作模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (module: string) => <Tag color="blue">{module}</Tag>
    },
    {
      title: '操作类型',
      dataIndex: 'operation',
      key: 'operation',
      width: 120,
      render: (operation: string) => <Tag color="green">{operation}</Tag>
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => {
        const colorMap: { [key: string]: string } = {
          'GET': 'blue',
          'POST': 'green',
          'PUT': 'orange',
          'DELETE': 'red'
        }
        return <Tag color={colorMap[method] || 'default'}>{method}</Tag>
      }
    },
    {
      title: '请求地址',
      dataIndex: 'requestUrl',
      key: 'requestUrl',
      width: 200,
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <Text code>{url}</Text>
        </Tooltip>
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'clientIp',
      key: 'clientIp',
      width: 120,
      render: (ip: string, record: OperationLog) => (
        <Tooltip title={record.location || '位置未知'}>
          <Space>
            <GlobalOutlined />
            {ip}
          </Space>
        </Tooltip>
      )
    },
    {
      title: '执行时间',
      dataIndex: 'executionTime',
      key: 'executionTime',
      width: 100,
      render: (time: number) => (
        <Text style={{ color: time > 1000 ? '#ff4d4f' : time > 500 ? '#faad14' : '#52c41a' }}>
          {time}ms
        </Text>
      ),
      sorter: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Badge 
          status={status === 'success' ? 'success' : 'error'} 
          text={status === 'success' ? '成功' : '失败'} 
        />
      )
    },
    {
      title: '操作时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => (
        <Space>
          <ClockCircleOutlined />
          {dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
        </Space>
      ),
      sorter: true
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record: OperationLog) => (
        <Tooltip title="查看详情">
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetail(record)}
          />
        </Tooltip>
      )
    }
  ]

  // 登录日志表格列
  const loginColumns: ColumnsType<LoginLog> = [
    {
      title: '用户名',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
      render: (name: string) => (
        <Space>
          <UserOutlined />
          {name}
        </Space>
      )
    },
    {
      title: '登录类型',
      dataIndex: 'loginType',
      key: 'loginType',
      width: 100,
      render: (type: string) => {
        const colorMap: { [key: string]: string } = {
          'web': 'blue',
          'mobile': 'green',
          'api': 'orange'
        }
        const textMap: { [key: string]: string } = {
          'web': 'Web端',
          'mobile': '移动端',
          'api': 'API'
        }
        return <Tag color={colorMap[type]}>{textMap[type]}</Tag>
      }
    },
    {
      title: 'IP地址',
      dataIndex: 'clientIp',
      key: 'clientIp',
      width: 120,
      render: (ip: string, record: LoginLog) => (
        <Tooltip title={record.location || '位置未知'}>
          <Space>
            <GlobalOutlined />
            {ip}
          </Space>
        </Tooltip>
      )
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 160,
      render: (time: string) => (
        <Space>
          <ClockCircleOutlined />
          {dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
        </Space>
      ),
      sorter: true
    },
    {
      title: '登出时间',
      dataIndex: 'logoutTime',
      key: 'logoutTime',
      width: 160,
      render: (time?: string) => (
        time ? (
          <Space>
            <ClockCircleOutlined />
            {dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: '在线时长',
      key: 'duration',
      width: 120,
      render: (_, record: LoginLog) => {
        if (!record.logoutTime) return <Text type="secondary">在线中</Text>
        
        const duration = dayjs(record.logoutTime).diff(record.loginTime, 'minute')
        const hours = Math.floor(duration / 60)
        const minutes = duration % 60
        
        return <Text>{hours > 0 ? `${hours}时${minutes}分` : `${minutes}分钟`}</Text>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string, record: LoginLog) => {
        if (status === 'success') {
          return <Badge status="success" text="成功" />
        } else {
          return (
            <Tooltip title={record.failureReason}>
              <Badge status="error" text="失败" />
            </Tooltip>
          )
        }
      }
    }
  ]

  // 获取操作日志
  const fetchOperationLogs = async () => {
    setState(prev => ({ ...prev, operationLoading: true }))
    try {
      const response = await systemService.getOperationLogs({
        page: state.operationCurrent,
        size: state.pageSize,
        ...operationFilters
      })
      
      setState(prev => ({
        ...prev,
        operationLogs: response.data.records,
        operationTotal: response.data.total,
        operationLoading: false
      }))
    } catch (error) {
      message.error('获取操作日志失败')
      setState(prev => ({ ...prev, operationLoading: false }))
    }
  }

  // 获取登录日志
  const fetchLoginLogs = async () => {
    setState(prev => ({ ...prev, loginLoading: true }))
    try {
      const response = await systemService.getLoginLogs({
        page: state.loginCurrent,
        size: state.pageSize,
        ...loginFilters
      })
      
      setState(prev => ({
        ...prev,
        loginLogs: response.data.records,
        loginTotal: response.data.total,
        loginLoading: false
      }))
    } catch (error) {
      message.error('获取登录日志失败')
      setState(prev => ({ ...prev, loginLoading: false }))
    }
  }

  // 查看详情
  const handleViewDetail = (log: OperationLog) => {
    setSelectedLog(log)
    setIsDetailModalVisible(true)
  }

  // 导出操作日志
  const handleExportOperationLogs = async () => {
    try {
      const response = await systemService.exportOperationLogs(operationFilters)
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = `操作日志_${dayjs().format('YYYY-MM-DD')}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 清理日志
  const handleClearLogs = (type: 'operation' | 'login', days: number) => {
    Modal.confirm({
      title: `清理${type === 'operation' ? '操作' : '登录'}日志`,
      content: `确定要清理${days}天前的${type === 'operation' ? '操作' : '登录'}日志吗？此操作不可恢复！`,
      onOk: async () => {
        try {
          if (type === 'operation') {
            await systemService.clearOperationLogs(days)
            fetchOperationLogs()
          } else {
            await systemService.clearLoginLogs(days)
            fetchLoginLogs()
          }
          message.success('清理成功')
        } catch (error) {
          message.error('清理失败')
        }
      }
    })
  }

  // 操作日志搜索
  const handleOperationSearch = (values: any) => {
    const filters: LogFilters = {}
    if (values.module) filters.module = values.module
    if (values.operation) filters.operation = values.operation
    if (values.status) filters.status = values.status
    if (values.dateRange) {
      filters.dateRange = [
        values.dateRange[0].format('YYYY-MM-DD'),
        values.dateRange[1].format('YYYY-MM-DD')
      ]
    }
    setOperationFilters(filters)
    setState(prev => ({ ...prev, operationCurrent: 1 }))
  }

  // 登录日志搜索
  const handleLoginSearch = (values: any) => {
    const filters: LogFilters = {}
    if (values.status) filters.status = values.status
    if (values.dateRange) {
      filters.dateRange = [
        values.dateRange[0].format('YYYY-MM-DD'),
        values.dateRange[1].format('YYYY-MM-DD')
      ]
    }
    setLoginFilters(filters)
    setState(prev => ({ ...prev, loginCurrent: 1 }))
  }

  // 表格变化处理
  const handleOperationTableChange = (pagination: any) => {
    setState(prev => ({
      ...prev,
      operationCurrent: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  const handleLoginTableChange = (pagination: any) => {
    setState(prev => ({
      ...prev,
      loginCurrent: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  useEffect(() => {
    fetchOperationLogs()
  }, [state.operationCurrent, state.pageSize, operationFilters])

  useEffect(() => {
    fetchLoginLogs()
  }, [state.loginCurrent, state.pageSize, loginFilters])

  return (
    <div>
      <Tabs defaultActiveKey="operation" size="large">
        <TabPane 
          tab={
            <Space>
              <HistoryOutlined />
              操作日志
            </Space>
          } 
          key="operation"
        >
          {/* 操作日志搜索 */}
          <Card style={{ marginBottom: 16 }}>
            <Form form={operationForm} layout="inline" onFinish={handleOperationSearch}>
              <Form.Item name="module">
                <Select placeholder="选择模块" style={{ width: 120 }} allowClear>
                  <Option value="user">用户管理</Option>
                  <Option value="case">案件管理</Option>
                  <Option value="assignment">智能分案</Option>
                  <Option value="mediation">调解管理</Option>
                  <Option value="litigation">诉讼管理</Option>
                  <Option value="settlement">结算管理</Option>
                  <Option value="system">系统管理</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="operation">
                <Select placeholder="操作类型" style={{ width: 120 }} allowClear>
                  <Option value="create">新增</Option>
                  <Option value="update">修改</Option>
                  <Option value="delete">删除</Option>
                  <Option value="query">查询</Option>
                  <Option value="export">导出</Option>
                  <Option value="import">导入</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="status">
                <Select placeholder="操作状态" style={{ width: 100 }} allowClear>
                  <Option value="success">成功</Option>
                  <Option value="failure">失败</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="dateRange">
                <RangePicker placeholder={['开始日期', '结束日期']} />
              </Form.Item>
              
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    搜索
                  </Button>
                  <Button 
                    onClick={() => {
                      operationForm.resetFields()
                      setOperationFilters({})
                    }}
                  >
                    重置
                  </Button>
                  <Button icon={<ExportOutlined />} onClick={handleExportOperationLogs}>
                    导出
                  </Button>
                  <Button 
                    danger 
                    icon={<ClearOutlined />} 
                    onClick={() => handleClearLogs('operation', 30)}
                  >
                    清理30天前
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={fetchOperationLogs}>
                    刷新
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          {/* 操作日志表格 */}
          <Card>
            <Table
              columns={operationColumns}
              dataSource={state.operationLogs}
              rowKey="id"
              loading={state.operationLoading}
              pagination={{
                current: state.operationCurrent,
                pageSize: state.pageSize,
                total: state.operationTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              onChange={handleOperationTableChange}
              scroll={{ x: 1400 }}
              size="small"
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <Space>
              <UserOutlined />
              登录日志
            </Space>
          } 
          key="login"
        >
          {/* 登录日志搜索 */}
          <Card style={{ marginBottom: 16 }}>
            <Form form={loginForm} layout="inline" onFinish={handleLoginSearch}>
              <Form.Item name="status">
                <Select placeholder="登录状态" style={{ width: 120 }} allowClear>
                  <Option value="success">成功</Option>
                  <Option value="failure">失败</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="dateRange">
                <RangePicker placeholder={['开始日期', '结束日期']} />
              </Form.Item>
              
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    搜索
                  </Button>
                  <Button 
                    onClick={() => {
                      loginForm.resetFields()
                      setLoginFilters({})
                    }}
                  >
                    重置
                  </Button>
                  <Button 
                    danger 
                    icon={<ClearOutlined />} 
                    onClick={() => handleClearLogs('login', 30)}
                  >
                    清理30天前
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={fetchLoginLogs}>
                    刷新
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          {/* 登录日志表格 */}
          <Card>
            <Table
              columns={loginColumns}
              dataSource={state.loginLogs}
              rowKey="id"
              loading={state.loginLoading}
              pagination={{
                current: state.loginCurrent,
                pageSize: state.pageSize,
                total: state.loginTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              onChange={handleLoginTableChange}
              scroll={{ x: 1200 }}
              size="small"
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 操作详情弹窗 */}
      <Modal
        title="操作日志详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedLog && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>操作用户:</strong> {selectedLog.userName}</p>
                <p><strong>操作模块:</strong> {selectedLog.module}</p>
                <p><strong>操作类型:</strong> {selectedLog.operation}</p>
                <p><strong>请求方法:</strong> {selectedLog.method}</p>
                <p><strong>请求地址:</strong> {selectedLog.requestUrl}</p>
              </Col>
              <Col span={12}>
                <p><strong>客户端IP:</strong> {selectedLog.clientIp}</p>
                <p><strong>位置信息:</strong> {selectedLog.location || '未知'}</p>
                <p><strong>执行时间:</strong> {selectedLog.executionTime}ms</p>
                <p><strong>操作状态:</strong> {selectedLog.status === 'success' ? '成功' : '失败'}</p>
                <p><strong>操作时间:</strong> {dayjs(selectedLog.createTime).format('YYYY-MM-DD HH:mm:ss')}</p>
              </Col>
            </Row>
            
            {selectedLog.requestParams && (
              <div>
                <Text strong>请求参数:</Text>
                <pre style={{ background: '#f5f5f5', padding: 8, marginTop: 8, fontSize: 12 }}>
                  {JSON.stringify(JSON.parse(selectedLog.requestParams), null, 2)}
                </pre>
              </div>
            )}
            
            {selectedLog.responseData && (
              <div style={{ marginTop: 16 }}>
                <Text strong>响应数据:</Text>
                <pre style={{ background: '#f5f5f5', padding: 8, marginTop: 8, fontSize: 12 }}>
                  {JSON.stringify(JSON.parse(selectedLog.responseData), null, 2)}
                </pre>
              </div>
            )}
            
            {selectedLog.errorMessage && (
              <div style={{ marginTop: 16 }}>
                <Text strong>错误信息:</Text>
                <pre style={{ background: '#fff2f0', padding: 8, marginTop: 8, fontSize: 12, color: '#ff4d4f' }}>
                  {selectedLog.errorMessage}
                </pre>
              </div>
            )}
            
            <div style={{ marginTop: 16 }}>
              <Text strong>用户代理:</Text>
              <p style={{ fontSize: 12, color: '#666' }}>{selectedLog.userAgent}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SystemLogsComponent