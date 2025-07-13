import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Space,
  Button,
  Alert,
  Table,
  Tag,
  Descriptions,
  Badge,
  Tooltip
} from 'antd'
import {
  MonitorOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  GlobalOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { SystemMonitor, HealthCheck } from '@/types'
import { systemService } from '@/services'

const { Title, Text } = Typography

interface MonitorState {
  monitor: SystemMonitor | null
  health: HealthCheck | null
  loading: boolean
  autoRefresh: boolean
  refreshInterval: NodeJS.Timeout | null
}

const SystemMonitorComponent: React.FC = () => {
  const [state, setState] = useState<MonitorState>({
    monitor: null,
    health: null,
    loading: false,
    autoRefresh: false,
    refreshInterval: null
  })

  const fetchMonitorData = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const [monitorResponse, healthResponse] = await Promise.all([
        systemService.getSystemMonitor(),
        systemService.getSystemHealth()
      ])
      
      setState(prev => ({
        ...prev,
        monitor: monitorResponse.data,
        health: healthResponse.data,
        loading: false
      }))
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const toggleAutoRefresh = () => {
    setState(prev => {
      if (prev.autoRefresh && prev.refreshInterval) {
        clearInterval(prev.refreshInterval)
        return { ...prev, autoRefresh: false, refreshInterval: null }
      } else {
        const interval = setInterval(fetchMonitorData, 30000) // 30秒刷新
        return { ...prev, autoRefresh: true, refreshInterval: interval }
      }
    })
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (uptime: string) => {
    // 假设 uptime 是秒数
    const seconds = parseInt(uptime)
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}天 ${hours}小时 ${minutes}分钟`
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success'
      case 'warning': return 'warning' 
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'warning': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      case 'critical': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      default: return <WarningOutlined />
    }
  }

  const healthColumns: ColumnsType<any> = [
    {
      title: '检查项',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Space>
          {getHealthStatusIcon(status)}
          <Badge status={getHealthStatusColor(status)} text={status === 'healthy' ? '正常' : status === 'warning' ? '警告' : '异常'} />
        </Space>
      )
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: '最后检查时间',
      dataIndex: 'lastCheck',
      key: 'lastCheck',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString()
    }
  ]

  useEffect(() => {
    fetchMonitorData()
    
    return () => {
      if (state.refreshInterval) {
        clearInterval(state.refreshInterval)
      }
    }
  }, [])

  if (!state.monitor || !state.health) {
    return <Card loading={state.loading}>加载中...</Card>
  }

  return (
    <div>
      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                <MonitorOutlined /> 系统监控
              </Title>
              <Text type="secondary">
                系统运行状态实时监控
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type={state.autoRefresh ? 'primary' : 'default'}
                onClick={toggleAutoRefresh}
              >
                {state.autoRefresh ? '停止自动刷新' : '开启自动刷新'}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchMonitorData}>
                手动刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 系统健康状态总览 */}
      <Alert
        message={
          <Space>
            {getHealthStatusIcon(state.health.overall)}
            <Text strong>
              系统整体状态: {state.health.overall === 'healthy' ? '健康' : state.health.overall === 'warning' ? '警告' : '异常'}
            </Text>
          </Space>
        }
        type={state.health.overall === 'healthy' ? 'success' : state.health.overall === 'warning' ? 'warning' : 'error'}
        style={{ marginBottom: 16 }}
      />

      {/* 服务器信息 */}
      <Card title={<Space><CloudServerOutlined />服务器信息</Space>} style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered>
          <Descriptions.Item label="主机名">{state.monitor.serverInfo.hostname}</Descriptions.Item>
          <Descriptions.Item label="操作系统">{state.monitor.serverInfo.os}</Descriptions.Item>
          <Descriptions.Item label="系统架构">{state.monitor.serverInfo.architecture}</Descriptions.Item>
          <Descriptions.Item label="Java版本">{state.monitor.serverInfo.javaVersion}</Descriptions.Item>
          <Descriptions.Item label="运行时间">{formatUptime(state.monitor.serverInfo.uptime)}</Descriptions.Item>
          <Descriptions.Item label="服务器时间">{state.monitor.serverInfo.serverTime}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 系统资源使用情况 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* CPU使用率 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="CPU使用率"
              value={state.monitor.cpuInfo.usage}
              precision={1}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ 
                color: state.monitor.cpuInfo.usage > 80 ? '#ff4d4f' : state.monitor.cpuInfo.usage > 60 ? '#faad14' : '#52c41a' 
              }}
            />
            <Progress 
              percent={state.monitor.cpuInfo.usage} 
              size="small" 
              showInfo={false}
              strokeColor={state.monitor.cpuInfo.usage > 80 ? '#ff4d4f' : state.monitor.cpuInfo.usage > 60 ? '#faad14' : '#52c41a'}
              style={{ marginTop: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              CPU核心数: {state.monitor.cpuInfo.cores}
            </Text>
          </Card>
        </Col>

        {/* 内存使用率 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="内存使用率"
              value={state.monitor.memoryInfo.usage}
              precision={1}
              suffix="%"
              prefix={<DatabaseOutlined />}
              valueStyle={{ 
                color: state.monitor.memoryInfo.usage > 80 ? '#ff4d4f' : state.monitor.memoryInfo.usage > 60 ? '#faad14' : '#52c41a' 
              }}
            />
            <Progress 
              percent={state.monitor.memoryInfo.usage} 
              size="small" 
              showInfo={false}
              strokeColor={state.monitor.memoryInfo.usage > 80 ? '#ff4d4f' : state.monitor.memoryInfo.usage > 60 ? '#faad14' : '#52c41a'}
              style={{ marginTop: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatBytes(state.monitor.memoryInfo.usedMemory)} / {formatBytes(state.monitor.memoryInfo.totalMemory)}
            </Text>
          </Card>
        </Col>

        {/* 磁盘使用率 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="磁盘使用率"
              value={state.monitor.diskInfo.usage}
              precision={1}
              suffix="%"
              prefix={<DatabaseOutlined />}
              valueStyle={{ 
                color: state.monitor.diskInfo.usage > 80 ? '#ff4d4f' : state.monitor.diskInfo.usage > 60 ? '#faad14' : '#52c41a' 
              }}
            />
            <Progress 
              percent={state.monitor.diskInfo.usage} 
              size="small" 
              showInfo={false}
              strokeColor={state.monitor.diskInfo.usage > 80 ? '#ff4d4f' : state.monitor.diskInfo.usage > 60 ? '#faad14' : '#52c41a'}
              style={{ marginTop: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatBytes(state.monitor.diskInfo.usedSpace)} / {formatBytes(state.monitor.diskInfo.totalSpace)}
            </Text>
          </Card>
        </Col>

        {/* 网络速度 */}
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <div>
                  <GlobalOutlined style={{ color: '#1890ff', fontSize: 24 }} />
                  <Title level={5} style={{ margin: '8px 0 0 0' }}>网络速度</Title>
                </div>
                <div>
                  <Text type="secondary">↓ {formatBytes(state.monitor.networkInfo.downloadSpeed)}/s</Text>
                  <br />
                  <Text type="secondary">↑ {formatBytes(state.monitor.networkInfo.uploadSpeed)}/s</Text>
                </div>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 应用程序状态 */}
      <Card title={<Space><ThunderboltOutlined />应用程序状态</Space>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="在线用户数"
              value={state.monitor.applicationInfo.activeUsers}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总请求数"
              value={state.monitor.applicationInfo.totalRequests}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="错误请求数"
              value={state.monitor.applicationInfo.errorRequests}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均响应时间"
              value={state.monitor.applicationInfo.avgResponseTime}
              suffix="ms"
              prefix={<MonitorOutlined />}
              valueStyle={{ 
                color: state.monitor.applicationInfo.avgResponseTime > 1000 ? '#ff4d4f' : state.monitor.applicationInfo.avgResponseTime > 500 ? '#faad14' : '#52c41a' 
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* 系统性能指标 */}
      <Card title={<Space><MonitorOutlined />系统性能指标</Space>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>响应时间</Text>
              <br />
              <Text style={{ fontSize: 24, color: state.health.metrics.responseTime > 1000 ? '#ff4d4f' : '#52c41a' }}>
                {state.health.metrics.responseTime}ms
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>错误率</Text>
              <br />
              <Text style={{ fontSize: 24, color: state.health.metrics.errorRate > 5 ? '#ff4d4f' : '#52c41a' }}>
                {state.health.metrics.errorRate}%
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>吞吐量</Text>
              <br />
              <Text style={{ fontSize: 24, color: '#1890ff' }}>
                {state.health.metrics.throughput}/s
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>可用性</Text>
              <br />
              <Text style={{ fontSize: 24, color: state.health.metrics.availability > 99 ? '#52c41a' : '#faad14' }}>
                {state.health.metrics.availability}%
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 健康检查详情 */}
      <Card title={<Space><CheckCircleOutlined />健康检查详情</Space>}>
        <Table
          columns={healthColumns}
          dataSource={state.health.checks}
          rowKey="name"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}

export default SystemMonitorComponent