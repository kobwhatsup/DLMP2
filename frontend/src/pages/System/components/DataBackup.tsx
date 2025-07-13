import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Form,
  Select,
  Input,
  message,
  Modal,
  Row,
  Col,
  Tag,
  Typography,
  Progress,
  Tooltip,
  Popconfirm,
  Alert,
  Statistic,
  Badge
} from 'antd'
import {
  FileProtectOutlined,
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UploadOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { BackupRecord } from '@/types'
import { systemService } from '@/services'
import dayjs from 'dayjs'

const { Option } = Select
const { Text, Title } = Typography

interface BackupState {
  backups: BackupRecord[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  creating: boolean
}

const DataBackupComponent: React.FC = () => {
  const [form] = Form.useForm()
  const [state, setState] = useState<BackupState>({
    backups: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10,
    creating: false
  })

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)

  const backupTypeOptions = [
    { label: '完整备份', value: 'full', description: '备份所有数据，耗时较长但最完整' },
    { label: '增量备份', value: 'incremental', description: '仅备份自上次备份后的变更数据' },
    { label: '差异备份', value: 'differential', description: '备份自上次完整备份后的所有变更数据' }
  ]

  const getBackupTypeInfo = (type: string) => {
    const typeMap: { [key: string]: { color: string; name: string } } = {
      'full': { color: 'blue', name: '完整备份' },
      'incremental': { color: 'green', name: '增量备份' },
      'differential': { color: 'orange', name: '差异备份' }
    }
    return typeMap[type] || { color: 'default', name: type }
  }

  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { color: string; text: string; icon: React.ReactNode } } = {
      'running': { 
        color: 'processing', 
        text: '备份中', 
        icon: <ClockCircleOutlined spin /> 
      },
      'completed': { 
        color: 'success', 
        text: '完成', 
        icon: <CheckCircleOutlined /> 
      },
      'failed': { 
        color: 'error', 
        text: '失败', 
        icon: <CloseCircleOutlined /> 
      }
    }
    return statusMap[status] || { color: 'default', text: status, icon: <ExclamationCircleOutlined /> }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}时${minutes}分${secs}秒`
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`
    } else {
      return `${secs}秒`
    }
  }

  const columns: ColumnsType<BackupRecord> = [
    {
      title: '备份名称',
      dataIndex: 'backupName',
      key: 'backupName',
      width: 200,
      ellipsis: true
    },
    {
      title: '备份类型',
      dataIndex: 'backupType',
      key: 'backupType',
      width: 120,
      render: (type: string) => {
        const info = getBackupTypeInfo(type)
        return <Tag color={info.color}>{info.name}</Tag>
      }
    },
    {
      title: '文件大小',
      dataIndex: 'backupSize',
      key: 'backupSize',
      width: 120,
      render: (size: number) => formatFileSize(size),
      sorter: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: BackupRecord) => {
        const info = getStatusInfo(status)
        return (
          <Tooltip title={record.errorMessage}>
            <Badge 
              status={info.color as any} 
              text={
                <Space>
                  {info.icon}
                  {info.text}
                </Space>
              } 
            />
          </Tooltip>
        )
      }
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: true
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (time?: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration?: number) => duration ? formatDuration(duration) : '-'
    },
    {
      title: '创建者',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record: BackupRecord) => (
        <Space size="small">
          {record.status === 'completed' && (
            <>
              <Tooltip title="下载备份">
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  size="small"
                  onClick={() => handleDownload(record)}
                />
              </Tooltip>
              <Tooltip title="恢复数据">
                <Popconfirm
                  title="确定要恢复这个备份吗？"
                  description="恢复操作将覆盖当前数据，请谨慎操作！"
                  onConfirm={() => handleRestore(record)}
                  okText="确定恢复"
                  cancelText="取消"
                  okType="danger"
                >
                  <Button
                    type="link"
                    icon={<UploadOutlined />}
                    size="small"
                  />
                </Popconfirm>
              </Tooltip>
            </>
          )}
          <Tooltip title="删除备份">
            <Popconfirm
              title="确定要删除这个备份吗？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ]

  const fetchBackups = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await systemService.getBackupRecords({
        page: state.current,
        size: state.pageSize
      })
      
      setState(prev => ({
        ...prev,
        backups: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取备份列表失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleCreateBackup = async (values: any) => {
    setState(prev => ({ ...prev, creating: true }))
    try {
      await systemService.createBackup(values)
      message.success('备份任务已启动')
      setIsCreateModalVisible(false)
      form.resetFields()
      fetchBackups()
      
      // 定期检查备份状态
      const checkInterval = setInterval(() => {
        fetchBackups()
      }, 5000)
      
      // 10分钟后停止检查
      setTimeout(() => {
        clearInterval(checkInterval)
      }, 600000)
      
    } catch (error) {
      message.error('创建备份失败')
    } finally {
      setState(prev => ({ ...prev, creating: false }))
    }
  }

  const handleDownload = async (record: BackupRecord) => {
    try {
      const response = await systemService.downloadBackup(record.id)
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = `${record.backupName}.zip`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('下载已开始')
    } catch (error) {
      message.error('下载失败')
    }
  }

  const handleRestore = async (record: BackupRecord) => {
    try {
      await systemService.restoreBackup(record.id)
      message.success('数据恢复已启动，系统将在恢复完成后重启')
    } catch (error) {
      message.error('数据恢复失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await systemService.deleteBackup(id)
      message.success('删除备份成功')
      fetchBackups()
    } catch (error) {
      message.error('删除备份失败')
    }
  }

  const handleTableChange = (pagination: any) => {
    setState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  // 统计信息
  const getStats = () => {
    const totalSize = state.backups.reduce((sum, backup) => sum + backup.backupSize, 0)
    const completedCount = state.backups.filter(backup => backup.status === 'completed').length
    const failedCount = state.backups.filter(backup => backup.status === 'failed').length
    const runningCount = state.backups.filter(backup => backup.status === 'running').length
    
    return { totalSize, completedCount, failedCount, runningCount }
  }

  const stats = getStats()

  useEffect(() => {
    fetchBackups()
  }, [state.current, state.pageSize])

  return (
    <div>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="备份总数"
              value={state.total}
              prefix={<FileProtectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总备份大小"
              value={formatFileSize(stats.totalSize)}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功备份"
              value={stats.completedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="备份中"
              value={stats.runningCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                <FileProtectOutlined /> 数据备份管理
              </Title>
              <Text type="secondary">
                定期备份数据，保障数据安全
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
                loading={state.creating}
              >
                创建备份
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchBackups}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 备份策略说明 */}
      <Alert
        message="备份策略说明"
        description={
          <div>
            <p><strong>完整备份:</strong> 备份所有数据，包括数据库、文件、配置等，适合定期执行</p>
            <p><strong>增量备份:</strong> 仅备份自上次备份后的变更数据，速度快，适合频繁执行</p>
            <p><strong>差异备份:</strong> 备份自上次完整备份后的所有变更，介于完整和增量之间</p>
            <p><strong>恢复说明:</strong> 恢复操作会覆盖当前数据，建议在维护窗口期执行</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 备份列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={state.backups}
          rowKey="id"
          loading={state.loading}
          pagination={{
            current: state.current,
            pageSize: state.pageSize,
            total: state.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 创建备份弹窗 */}
      <Modal
        title="创建数据备份"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
        confirmLoading={state.creating}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateBackup}>
          <Form.Item
            name="backupType"
            label="备份类型"
            rules={[{ required: true, message: '请选择备份类型' }]}
          >
            <Select placeholder="请选择备份类型">
              {backupTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div>
                    <Text strong>{option.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {option.description}
                    </Text>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="backupName"
            label="备份名称"
            rules={[{ required: true, message: '请输入备份名称' }]}
            initialValue={`backup_${dayjs().format('YYYY_MM_DD_HH_mm_ss')}`}
          >
            <Input placeholder="请输入备份名称" />
          </Form.Item>

          <Alert
            message="备份说明"
            description={
              <div>
                <p>• 备份过程中系统可能会有短暂的性能影响</p>
                <p>• 完整备份耗时较长，请在业务低峰期执行</p>
                <p>• 备份文件会保存在服务器指定目录中</p>
                <p>• 建议定期清理旧的备份文件以节省存储空间</p>
              </div>
            }
            type="warning"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  )
}

export default DataBackupComponent