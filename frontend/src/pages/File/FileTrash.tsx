import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  message,
  Modal,
  Card,
  Row,
  Col,
  Tag,
  Tooltip,
  Typography,
  Alert,
  Checkbox,
  Empty,
  Popconfirm
} from 'antd'
import {
  DeleteOutlined,
  ReloadOutlined,
  UndoOutlined,
  ClearOutlined,
  ExclamationCircleOutlined,
  FileOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  FireOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { FileRecord, FileType } from '@/types'
import { fileService } from '@/services'
import { formatDateTime, formatFileSize } from '@/utils'

const { Text, Title } = Typography
const { confirm } = Modal

interface TrashState {
  files: FileRecord[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  selectedIds: number[]
}

const FileTrash: React.FC = () => {
  const [state, setState] = useState<TrashState>({
    files: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10,
    selectedIds: []
  })

  // 获取文件类型图标
  const getFileTypeIcon = (fileType: FileType) => {
    const iconMap = {
      [FileType.DOCUMENT]: '📄',
      [FileType.IMAGE]: '🖼️',
      [FileType.VIDEO]: '🎥',
      [FileType.AUDIO]: '🎵',
      [FileType.ARCHIVE]: '📦',
      [FileType.OTHER]: '📁'
    }
    return iconMap[fileType] || '📁'
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

  // 计算剩余天数
  const getRemainingDays = (deleteTime: string) => {
    const deleteDate = new Date(deleteTime)
    const expireDate = new Date(deleteDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
    const now = new Date()
    const remainingMs = expireDate.getTime() - now.getTime()
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000))
    return Math.max(0, remainingDays)
  }

  // 表格列定义
  const columns: ColumnsType<FileRecord> = [
    {
      title: '文件名',
      dataIndex: 'originalName',
      key: 'originalName',
      width: 300,
      render: (name, record) => (
        <Space>
          <Checkbox
            checked={state.selectedIds.includes(record.id)}
            onChange={(e) => handleSelectFile(record.id, e.target.checked)}
          />
          <span style={{ fontSize: 20 }}>
            {getFileTypeIcon(record.fileType)}
          </span>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {name}
          </Text>
        </Space>
      )
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 120,
      render: (size: number) => formatFileSize(size),
      sorter: true
    },
    {
      title: '文件类型',
      dataIndex: 'fileType',
      key: 'fileType',
      width: 100,
      render: (type: FileType) => (
        <Tag color="blue">{getFileTypeName(type)}</Tag>
      )
    },
    {
      title: '删除者',
      dataIndex: 'uploaderName',
      key: 'uploaderName',
      width: 120,
      ellipsis: true
    },
    {
      title: '删除时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 160,
      render: (time: string) => formatDateTime(time),
      sorter: true
    },
    {
      title: '剩余天数',
      key: 'remainingDays',
      width: 120,
      render: (_, record) => {
        const days = getRemainingDays(record.updateTime || record.createTime)
        const color = days <= 3 ? '#ff4d4f' : days <= 7 ? '#faad14' : '#52c41a'
        return (
          <Space>
            <ClockCircleOutlined style={{ color }} />
            <Text style={{ color }}>
              {days > 0 ? `${days}天` : '即将删除'}
            </Text>
          </Space>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="恢复文件">
            <Button
              type="link"
              icon={<UndoOutlined />}
              size="small"
              onClick={() => handleRestoreFile(record)}
            />
          </Tooltip>
          <Tooltip title="彻底删除">
            <Popconfirm
              title="确定要彻底删除这个文件吗？"
              description="彻底删除后无法恢复！"
              onConfirm={() => handlePermanentDelete(record)}
              okText="确定删除"
              cancelText="取消"
              okType="danger"
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

  // 获取回收站文件列表
  const fetchTrashFiles = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await fileService.getTrashFiles({
        page: state.current,
        size: state.pageSize
      })
      
      setState(prev => ({
        ...prev,
        files: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取回收站列表失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // 文件选择
  const handleSelectFile = (fileId: number, checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedIds: checked
        ? [...prev.selectedIds, fileId]
        : prev.selectedIds.filter(id => id !== fileId)
    }))
  }

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedIds: checked ? prev.files.map(file => file.id) : []
    }))
  }

  // 恢复文件
  const handleRestoreFile = async (file: FileRecord) => {
    try {
      await fileService.restoreFile(file.id)
      message.success(`文件 "${file.originalName}" 已恢复`)
      fetchTrashFiles()
    } catch (error) {
      message.error('恢复文件失败')
    }
  }

  // 批量恢复
  const handleBatchRestore = () => {
    if (state.selectedIds.length === 0) {
      message.warning('请选择要恢复的文件')
      return
    }

    confirm({
      title: '批量恢复',
      content: `确定要恢复选中的 ${state.selectedIds.length} 个文件吗？`,
      onOk: async () => {
        try {
          const restorePromises = state.selectedIds.map(id => 
            fileService.restoreFile(id)
          )
          await Promise.all(restorePromises)
          message.success('批量恢复成功')
          setState(prev => ({ ...prev, selectedIds: [] }))
          fetchTrashFiles()
        } catch (error) {
          message.error('批量恢复失败')
        }
      }
    })
  }

  // 彻底删除文件
  const handlePermanentDelete = async (file: FileRecord) => {
    try {
      await fileService.permanentDeleteFile(file.id)
      message.success(`文件 "${file.originalName}" 已彻底删除`)
      fetchTrashFiles()
    } catch (error) {
      message.error('彻底删除失败')
    }
  }

  // 批量彻底删除
  const handleBatchPermanentDelete = () => {
    if (state.selectedIds.length === 0) {
      message.warning('请选择要删除的文件')
      return
    }

    confirm({
      title: '批量彻底删除',
      content: `确定要彻底删除选中的 ${state.selectedIds.length} 个文件吗？删除后无法恢复！`,
      icon: <ExclamationCircleOutlined />,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const deletePromises = state.selectedIds.map(id => 
            fileService.permanentDeleteFile(id)
          )
          await Promise.all(deletePromises)
          message.success('批量删除成功')
          setState(prev => ({ ...prev, selectedIds: [] }))
          fetchTrashFiles()
        } catch (error) {
          message.error('批量删除失败')
        }
      }
    })
  }

  // 清空回收站
  const handleEmptyTrash = () => {
    confirm({
      title: '清空回收站',
      content: '确定要清空整个回收站吗？所有文件将被彻底删除，无法恢复！',
      icon: <ExclamationCircleOutlined />,
      okText: '确定清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await fileService.emptyTrash()
          message.success('回收站已清空')
          fetchTrashFiles()
        } catch (error) {
          message.error('清空回收站失败')
        }
      }
    })
  }

  // 表格变化处理
  const handleTableChange = (pagination: any) => {
    setState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  useEffect(() => {
    fetchTrashFiles()
  }, [state.current, state.pageSize])

  return (
    <div>
      {/* 回收站说明 */}
      <Alert
        message="回收站说明"
        description={
          <div>
            <p>• 删除的文件会保留在回收站30天，期间可以恢复</p>
            <p>• 超过30天的文件将被自动彻底删除</p>
            <p>• 彻底删除的文件无法恢复，请谨慎操作</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                <DeleteOutlined /> 回收站
              </Title>
              <Text type="secondary">
                共 {state.total} 个文件
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<UndoOutlined />}
                onClick={handleBatchRestore}
                disabled={state.selectedIds.length === 0}
              >
                批量恢复
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchPermanentDelete}
                disabled={state.selectedIds.length === 0}
              >
                批量删除
              </Button>
              <Button
                danger
                icon={<ClearOutlined />}
                onClick={handleEmptyTrash}
                disabled={state.files.length === 0}
              >
                清空回收站
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchTrashFiles}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 批量操作提示 */}
      {state.selectedIds.length > 0 && (
        <Alert
          message={
            <Space>
              <span>已选择 {state.selectedIds.length} 个文件</span>
              <Button 
                size="small" 
                onClick={() => setState(prev => ({ ...prev, selectedIds: [] }))}
              >
                取消选择
              </Button>
            </Space>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 文件列表 */}
      <Card>
        {state.files.length > 0 ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <Checkbox
                checked={state.selectedIds.length === state.files.length && state.files.length > 0}
                indeterminate={state.selectedIds.length > 0 && state.selectedIds.length < state.files.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                全选
              </Checkbox>
            </div>
            
            <Table
              columns={columns}
              dataSource={state.files}
              rowKey="id"
              loading={state.loading}
              pagination={{
                current: state.current,
                pageSize: state.pageSize,
                total: state.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个文件`
              }}
              onChange={handleTableChange}
              scroll={{ x: 1000 }}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <DeleteOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
            <Title level={4} style={{ color: '#999', marginTop: 16 }}>
              回收站为空
            </Title>
            <Text type="secondary">
              暂无已删除的文件
            </Text>
          </div>
        )}
      </Card>

      {/* 快速操作提示 */}
      <Card title="快速操作" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" hoverable>
              <Space>
                <UndoOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                <div>
                  <Text strong>恢复最近删除</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    恢复7天内删除的文件
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" hoverable>
              <Space>
                <FireOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
                <div>
                  <Text strong>清理过期文件</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    删除超过25天的文件
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" hoverable>
              <Space>
                <ClockCircleOutlined style={{ fontSize: 20, color: '#faad14' }} />
                <div>
                  <Text strong>自动清理</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    设置自动清理规则
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default FileTrash