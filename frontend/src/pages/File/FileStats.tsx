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
  DatePicker,
  Select,
  Table,
  Tag,
  Tooltip,
  Alert,
  Empty
} from 'antd'
import {
  FolderOutlined,
  FileOutlined,
  UploadOutlined,
  DownloadOutlined,
  PieChartOutlined,
  BarChartOutlined,
  ReloadOutlined,
  ExportOutlined
} from '@ant-design/icons'
import { FileStats, FileType, StorageType } from '@/types'
import { fileService } from '@/services'
import { formatFileSize } from '@/utils'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

interface StatsState {
  stats: FileStats | null
  storageUsage: any
  loading: boolean
  dateRange: [string, string]
}

const FileStatsComponent: React.FC = () => {
  const [state, setState] = useState<StatsState>({
    stats: null,
    storageUsage: null,
    loading: false,
    dateRange: [
      dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
      dayjs().format('YYYY-MM-DD')
    ]
  })

  // 获取文件统计
  const fetchFileStats = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await fileService.getFileStats({
        startDate: state.dateRange[0],
        endDate: state.dateRange[1]
      })
      setState(prev => ({
        ...prev,
        stats: response.data,
        loading: false
      }))
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取存储使用情况
  const fetchStorageUsage = async () => {
    try {
      const response = await fileService.getStorageUsage()
      setState(prev => ({ ...prev, storageUsage: response.data }))
    } catch (error) {
      console.error('获取存储使用情况失败')
    }
  }

  // 获取文件类型名称
  const getFileTypeName = (fileType: FileType) => {
    const typeMap = {
      [FileType.DOCUMENT]: '文档',
      [FileType.IMAGE]: '图片',
      [FileType.VIDEO]: '视频',
      [FileType.AUDIO]: '音频',
      [FileType.ARCHIVE]: '压缩包',
      [FileType.OTHER]: '其他'
    }
    return typeMap[fileType] || '未知'
  }

  // 获取存储类型名称
  const getStorageTypeName = (storageType: StorageType) => {
    const typeMap = {
      [StorageType.LOCAL]: '本地存储',
      [StorageType.OSS]: '对象存储',
      [StorageType.CDN]: 'CDN存储'
    }
    return typeMap[storageType] || '未知'
  }

  // 获取文件类型颜色
  const getFileTypeColor = (fileType: FileType) => {
    const colorMap = {
      [FileType.DOCUMENT]: '#1890ff',
      [FileType.IMAGE]: '#52c41a',
      [FileType.VIDEO]: '#722ed1',
      [FileType.AUDIO]: '#fa8c16',
      [FileType.ARCHIVE]: '#faad14',
      [FileType.OTHER]: '#666'
    }
    return colorMap[fileType] || '#666'
  }

  // 文件类型分布表格列
  const typeColumns = [
    {
      title: '文件类型',
      key: 'fileType',
      render: (record: any) => (
        <Space>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: getFileTypeColor(record.fileType)
            }}
          />
          <span>{record.typeName}</span>
        </Space>
      )
    },
    {
      title: '文件数量',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => count.toLocaleString()
    },
    {
      title: '占用空间',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size)
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => (
        <div style={{ width: 120 }}>
          <Progress
            percent={percentage}
            size="small"
            format={percent => `${percent}%`}
          />
        </div>
      )
    }
  ]

  // 存储类型分布表格列
  const storageColumns = [
    {
      title: '存储类型',
      key: 'storageType',
      render: (record: any) => (
        <Tag color="blue">{getStorageTypeName(record.storageType)}</Tag>
      )
    },
    {
      title: '文件数量',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => count.toLocaleString()
    },
    {
      title: '占用空间',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size)
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => (
        <div style={{ width: 120 }}>
          <Progress
            percent={percentage}
            size="small"
            format={percent => `${percent}%`}
          />
        </div>
      )
    }
  ]

  // 月度统计表格列
  const monthlyColumns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month'
    },
    {
      title: '上传数量',
      dataIndex: 'uploads',
      key: 'uploads',
      render: (count: number) => count.toLocaleString()
    },
    {
      title: '下载数量',
      dataIndex: 'downloads',
      key: 'downloads',
      render: (count: number) => count.toLocaleString()
    },
    {
      title: '新增容量',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size)
    }
  ]

  // 时间范围变化
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setState(prev => ({
        ...prev,
        dateRange: [
          dates[0].format('YYYY-MM-DD'),
          dates[1].format('YYYY-MM-DD')
        ]
      }))
    }
  }

  // 导出统计报告
  const handleExportReport = async () => {
    try {
      const response = await fileService.exportFileList({
        page: 1,
        size: 10000
      })
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = `文件统计报告_${dayjs().format('YYYY-MM-DD')}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出报告失败')
    }
  }

  useEffect(() => {
    fetchFileStats()
    fetchStorageUsage()
  }, [state.dateRange])

  if (!state.stats) {
    return <Empty description="暂无统计数据" />
  }

  return (
    <div>
      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text>统计时间范围:</Text>
              <RangePicker
                value={[dayjs(state.dateRange[0]), dayjs(state.dateRange[1])]}
                onChange={handleDateRangeChange}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExportReport}
              >
                导出报告
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchFileStats()
                  fetchStorageUsage()
                }}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 总体统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总文件数"
              value={state.stats.totalFiles}
              prefix={<FileOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总存储容量"
              value={formatFileSize(state.stats.totalSize)}
              prefix={<FolderOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日上传"
              value={state.stats.todayUploads}
              prefix={<UploadOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日下载"
              value={state.stats.todayDownloads}
              prefix={<DownloadOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 存储使用情况 */}
      {state.storageUsage && (
        <Card title="存储使用情况" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={state.storageUsage.usagePercentage}
                  format={percent => (
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 'bold' }}>{percent}%</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {formatFileSize(state.storageUsage.totalUsed)} / {formatFileSize(state.storageUsage.totalLimit)}
                      </div>
                    </div>
                  )}
                  width={200}
                />
              </div>
            </Col>
            <Col span={12}>
              <Title level={5}>存储分布</Title>
              <div>
                {state.storageUsage.byStorage?.map((item: any, index: number) => (
                  <div key={index} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{getStorageTypeName(item.storageType)}</span>
                      <span>{formatFileSize(item.size)}</span>
                    </div>
                    <Progress
                      percent={(item.size / state.storageUsage.totalUsed) * 100}
                      size="small"
                      showInfo={false}
                    />
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Card>
      )}

      <Row gutter={16}>
        {/* 文件类型分布 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <PieChartOutlined />
                文件类型分布
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              dataSource={state.stats.typeDistribution}
              columns={typeColumns}
              rowKey="fileType"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 存储类型分布 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <BarChartOutlined />
                存储类型分布
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              dataSource={state.stats.storageUsage}
              columns={storageColumns}
              rowKey="storageType"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 月度统计趋势 */}
      <Card title="月度统计趋势">
        {state.stats.monthlyStats && state.stats.monthlyStats.length > 0 ? (
          <Table
            dataSource={state.stats.monthlyStats}
            columns={monthlyColumns}
            rowKey="month"
            pagination={{
              pageSize: 12,
              showSizeChanger: false
            }}
            size="small"
          />
        ) : (
          <Alert
            message="暂无月度统计数据"
            description="请等待数据收集完成或调整时间范围。"
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* 使用提示 */}
      <Alert
        message="统计说明"
        description={
          <div>
            <p>• 统计数据每小时更新一次，可能存在轻微延迟</p>
            <p>• 存储容量包含文件本体、缩略图和预览文件</p>
            <p>• 删除的文件会在回收站保留30天，仍占用存储空间</p>
            <p>• 月度统计显示最近12个月的数据变化趋势</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </div>
  )
}

export default FileStatsComponent