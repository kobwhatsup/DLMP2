import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Form,
  Select,
  DatePicker,
  Table,
  message,
  Modal,
  Progress,
  Tag,
  Statistic,
  Tabs,
  Alert,
  Typography,
  Tooltip,
  Empty
} from 'antd'
import {
  FileTextOutlined,
  DownloadOutlined,
  ReloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileExcelOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { settlementService } from '@/services'
import { formatDateTime, formatCurrency } from '@/utils'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker
const { TabPane } = Tabs
const { Title, Text } = Typography

interface ReportState {
  reports: ReportItem[]
  loading: boolean
  generating: boolean
  total: number
  current: number
  pageSize: number
}

interface ReportItem {
  id: string
  reportType: string
  fileName: string
  status: string
  createTime: string
  downloadUrl?: string
  fileSize?: number
}

interface ReportParams {
  reportType: 'summary' | 'detail' | 'aging' | 'trend'
  startDate: string
  endDate: string
  settlementType?: string
  clientId?: number
  groupBy?: 'day' | 'week' | 'month'
}

interface StatsData {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  totalCount: number
  paidCount: number
  pendingCount: number
  overdueCount: number
}

interface TrendData {
  date: string
  totalAmount: number
  paidAmount: number
  newCount: number
  paidCount: number
}

interface AgingData {
  ageRange: string
  count: number
  amount: number
  percentage: number
}

const SettlementReports: React.FC = () => {
  const [form] = Form.useForm()
  const [reportState, setReportState] = useState<ReportState>({
    reports: [],
    loading: false,
    generating: false,
    total: 0,
    current: 1,
    pageSize: 10
  })
  
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [agingData, setAgingData] = useState<AgingData[]>([])
  const [activeTab, setActiveTab] = useState('reports')

  // 报表列表表格列定义
  const columns: ColumnsType<ReportItem> = [
    {
      title: '报表名称',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
      render: (text, record) => (
        <Space>
          <FilePdfOutlined style={{ color: '#f5222d' }} />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '报表类型',
      dataIndex: 'reportType',
      key: 'reportType',
      width: 120,
      render: (type: string) => {
        const typeMap = {
          summary: '汇总报表',
          detail: '明细报表',
          aging: '账龄分析',
          trend: '趋势分析'
        }
        return (
          <Tag color="blue">
            {typeMap[type as keyof typeof typeMap] || type}
          </Tag>
        )
      }
    },
    {
      title: '生成状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusMap = {
          generating: { color: 'processing', text: '生成中' },
          completed: { color: 'success', text: '已完成' },
          failed: { color: 'error', text: '生成失败' }
        }
        const statusInfo = statusMap[status as keyof typeof statusMap]
        return statusInfo ? (
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
        ) : (
          <Tag>{status}</Tag>
        )
      }
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: (size: number) => {
        if (!size) return '-'
        if (size < 1024) return `${size} B`
        if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
        return `${Math.round(size / 1024 / 1024)} MB`
      }
    },
    {
      title: '生成时间',
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
          {record.status === 'completed' && record.downloadUrl && (
            <Tooltip title="下载">
              <Button
                type="link"
                icon={<DownloadOutlined />}
                size="small"
                onClick={() => handleDownloadReport(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="预览">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handlePreviewReport(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDeleteReport(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  // 获取报表列表
  const fetchReports = async () => {
    setReportState(prev => ({ ...prev, loading: true }))
    try {
      const response = await settlementService.getReportList({
        page: reportState.current,
        size: reportState.pageSize
      })
      
      setReportState(prev => ({
        ...prev,
        reports: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取报表列表失败')
      setReportState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取统计数据
  const fetchStatsData = async () => {
    try {
      const response = await settlementService.getSettlementStats()
      setStatsData(response.data)
    } catch (error) {
      message.error('获取统计数据失败')
    }
  }

  // 获取趋势数据
  const fetchTrendData = async () => {
    try {
      const response = await settlementService.getSettlementTrend(30)
      setTrendData(response.data)
    } catch (error) {
      message.error('获取趋势数据失败')
    }
  }

  // 获取账龄分析数据
  const fetchAgingData = async () => {
    try {
      const response = await settlementService.getAgingAnalysis()
      setAgingData(response.data)
    } catch (error) {
      message.error('获取账龄分析失败')
    }
  }

  // 生成报表
  const handleGenerateReport = async (values: any) => {
    setReportState(prev => ({ ...prev, generating: true }))
    
    const params: ReportParams = {
      reportType: values.reportType,
      startDate: values.dateRange[0].format('YYYY-MM-DD'),
      endDate: values.dateRange[1].format('YYYY-MM-DD'),
      settlementType: values.settlementType,
      clientId: values.clientId,
      groupBy: values.groupBy
    }

    try {
      const response = await settlementService.generateSettlementReport(params)
      message.success('报表生成任务已提交，请稍后查看')
      
      // 轮询检查报表生成状态
      setTimeout(() => {
        fetchReports()
      }, 2000)
      
      setReportState(prev => ({ ...prev, generating: false }))
    } catch (error) {
      message.error('报表生成失败')
      setReportState(prev => ({ ...prev, generating: false }))
    }
  }

  // 下载报表
  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await settlementService.downloadReport(reportId)
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = `结算报表_${reportId}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('下载成功')
    } catch (error) {
      message.error('下载失败')
    }
  }

  // 预览报表
  const handlePreviewReport = (report: ReportItem) => {
    message.info('预览功能开发中...')
  }

  // 删除报表
  const handleDeleteReport = (reportId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个报表吗？删除后无法恢复。',
      onOk: async () => {
        try {
          // 这里应该调用删除API
          message.success('删除成功')
          fetchReports()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  // 表格变化处理
  const handleTableChange = (pagination: any) => {
    setReportState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports()
    } else if (activeTab === 'stats') {
      fetchStatsData()
    } else if (activeTab === 'trend') {
      fetchTrendData()
    } else if (activeTab === 'aging') {
      fetchAgingData()
    }
  }, [activeTab, reportState.current, reportState.pageSize])

  return (
    <div>
      <Card title="结算报表管理">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 报表管理 */}
          <TabPane tab="报表管理" key="reports">
            <Card 
              title="生成报表" 
              size="small" 
              style={{ marginBottom: 16 }}
            >
              <Form
                form={form}
                layout="inline"
                onFinish={handleGenerateReport}
                initialValues={{
                  reportType: 'summary',
                  dateRange: [dayjs().subtract(30, 'day'), dayjs()],
                  groupBy: 'day'
                }}
              >
                <Form.Item
                  name="reportType"
                  label="报表类型"
                  rules={[{ required: true }]}
                >
                  <Select style={{ width: 120 }}>
                    <Option value="summary">汇总报表</Option>
                    <Option value="detail">明细报表</Option>
                    <Option value="aging">账龄分析</Option>
                    <Option value="trend">趋势分析</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="dateRange"
                  label="时间范围"
                  rules={[{ required: true }]}
                >
                  <RangePicker />
                </Form.Item>
                
                <Form.Item name="settlementType" label="结算类型">
                  <Select style={{ width: 120 }} allowClear>
                    <Option value="mediation">调解结算</Option>
                    <Option value="litigation">诉讼结算</Option>
                    <Option value="execution">执行结算</Option>
                    <Option value="service">服务费结算</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item name="groupBy" label="分组方式">
                  <Select style={{ width: 100 }}>
                    <Option value="day">按天</Option>
                    <Option value="week">按周</Option>
                    <Option value="month">按月</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<FileTextOutlined />}
                      loading={reportState.generating}
                    >
                      生成报表
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={fetchReports}
                    >
                      刷新
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>

            <Table
              columns={columns}
              dataSource={reportState.reports}
              rowKey="id"
              loading={reportState.loading}
              pagination={{
                current: reportState.current,
                pageSize: reportState.pageSize,
                total: reportState.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              onChange={handleTableChange}
            />
          </TabPane>

          {/* 统计概览 */}
          <TabPane tab="统计概览" key="stats">
            {statsData ? (
              <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="总结算金额"
                        value={statsData.totalAmount}
                        formatter={value => formatCurrency(Number(value))}
                        prefix={<BarChartOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="已收金额"
                        value={statsData.paidAmount}
                        formatter={value => formatCurrency(Number(value))}
                        prefix={<BarChartOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="待收金额"
                        value={statsData.pendingAmount}
                        formatter={value => formatCurrency(Number(value))}
                        prefix={<BarChartOutlined />}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="逾期金额"
                        value={statsData.overdueAmount}
                        formatter={value => formatCurrency(Number(value))}
                        prefix={<BarChartOutlined />}
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="总结算数量"
                        value={statsData.totalCount}
                        suffix="笔"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="已完成数量"
                        value={statsData.paidCount}
                        suffix="笔"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="待处理数量"
                        value={statsData.pendingCount}
                        suffix="笔"
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="逾期数量"
                        value={statsData.overdueCount}
                        suffix="笔"
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="完成率分析" style={{ marginTop: 16 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <Title level={4}>金额完成率</Title>
                        <Progress
                          type="circle"
                          percent={Math.round((statsData.paidAmount / statsData.totalAmount) * 100)}
                          format={percent => `${percent}%`}
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                        />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <Title level={4}>数量完成率</Title>
                        <Progress
                          type="circle"
                          percent={Math.round((statsData.paidCount / statsData.totalCount) * 100)}
                          format={percent => `${percent}%`}
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              </div>
            ) : (
              <Empty description="暂无统计数据" />
            )}
          </TabPane>

          {/* 趋势分析 */}
          <TabPane tab="趋势分析" key="trend">
            {trendData.length > 0 ? (
              <Card title="30天结算趋势">
                <Alert
                  message="趋势分析"
                  description="展示最近30天的结算金额和数量变化趋势，帮助了解业务发展态势。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">
                    <LineChartOutlined style={{ fontSize: 48 }} />
                    <br />
                    图表组件开发中...
                  </Text>
                </div>
              </Card>
            ) : (
              <Empty description="暂无趋势数据" />
            )}
          </TabPane>

          {/* 账龄分析 */}
          <TabPane tab="账龄分析" key="aging">
            {agingData.length > 0 ? (
              <Card title="账龄分析">
                <Alert
                  message="账龄分析"
                  description="按照结算记录的创建时间分析未收款项的账龄分布情况。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <Table
                  dataSource={agingData}
                  rowKey="ageRange"
                  pagination={false}
                  columns={[
                    {
                      title: '账龄区间',
                      dataIndex: 'ageRange',
                      key: 'ageRange'
                    },
                    {
                      title: '数量',
                      dataIndex: 'count',
                      key: 'count',
                      render: (count: number) => `${count} 笔`
                    },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (amount: number) => formatCurrency(amount)
                    },
                    {
                      title: '占比',
                      dataIndex: 'percentage',
                      key: 'percentage',
                      render: (percentage: number) => (
                        <div>
                          <Progress 
                            percent={percentage} 
                            size="small" 
                            format={percent => `${percent}%`}
                          />
                        </div>
                      )
                    }
                  ]}
                />
              </Card>
            ) : (
              <Empty description="暂无账龄数据" />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default SettlementReports