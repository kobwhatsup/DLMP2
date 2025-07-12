import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Card,
  Row,
  Col,
  Tag,
  Tooltip,
  Typography,
  DatePicker,
  Switch,
  QRCode,
  Divider,
  Alert,
  Popconfirm,
  Select,
  Copy
} from 'antd'
import {
  ShareAltOutlined,
  LinkOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  QrcodeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { FileShare, FileRecord } from '@/types'
import { fileService } from '@/services'
import { formatDateTime } from '@/utils'
import dayjs from 'dayjs'

const { Option } = Select
const { Text, Title, Paragraph } = Typography

interface ShareState {
  shares: FileShare[]
  files: FileRecord[]
  loading: boolean
  total: number
  current: number
  pageSize: number
}

interface ShareFormData {
  fileId: number
  password?: string
  downloadLimit?: number
  viewLimit?: number
  expireHours?: number
}

const FileShareComponent: React.FC = () => {
  const [form] = Form.useForm()
  const [state, setState] = useState<ShareState>({
    shares: [],
    files: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10
  })
  
  const [currentShare, setCurrentShare] = useState<FileShare | null>(null)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isQRModalVisible, setIsQRModalVisible] = useState(false)

  // 表格列定义
  const columns: ColumnsType<FileShare> = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 250,
      ellipsis: true,
      render: (name: string, record: FileShare) => (
        <Space>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {name}
          </Text>
          {record.password && <LockOutlined style={{ color: '#faad14' }} />}
        </Space>
      )
    },
    {
      title: '分享码',
      dataIndex: 'shareCode',
      key: 'shareCode',
      width: 120,
      render: (code: string) => (
        <Space>
          <Text code>{code}</Text>
          <Tooltip title="复制分享码">
            <Button
              type="link"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(code)
                message.success('分享码已复制')
              }}
            />
          </Tooltip>
        </Space>
      )
    },
    {
      title: '分享链接',
      dataIndex: 'shareUrl',
      key: 'shareUrl',
      width: 150,
      render: (url: string) => (
        <Space>
          <Tooltip title={url}>
            <Button
              type="link"
              icon={<LinkOutlined />}
              size="small"
              onClick={() => window.open(url, '_blank')}
            >
              访问
            </Button>
          </Tooltip>
          <Tooltip title="复制链接">
            <Button
              type="link"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(url)
                message.success('分享链接已复制')
              }}
            />
          </Tooltip>
        </Space>
      )
    },
    {
      title: '下载统计',
      key: 'downloadStats',
      width: 120,
      render: (_, record) => (
        <div>
          <Text>{record.downloadCount}</Text>
          {record.downloadLimit && (
            <Text type="secondary">/{record.downloadLimit}</Text>
          )}
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            下载次数
          </Text>
        </div>
      )
    },
    {
      title: '访问统计',
      key: 'viewStats',
      width: 120,
      render: (_, record) => (
        <div>
          <Text>{record.viewCount}</Text>
          {record.viewLimit && (
            <Text type="secondary">/{record.viewLimit}</Text>
          )}
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            访问次数
          </Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record) => {
        const isExpired = record.expireTime && new Date(record.expireTime) < new Date()
        const isDownloadExceeded = record.downloadLimit && record.downloadCount >= record.downloadLimit
        const isViewExceeded = record.viewLimit && record.viewCount >= record.viewLimit
        
        if (!isActive) {
          return <Tag color="red">已停用</Tag>
        } else if (isExpired) {
          return <Tag color="red">已过期</Tag>
        } else if (isDownloadExceeded) {
          return <Tag color="orange">下载已满</Tag>
        } else if (isViewExceeded) {
          return <Tag color="orange">访问已满</Tag>
        } else {
          return <Tag color="green">有效</Tag>
        }
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => formatDateTime(time),
      sorter: true
    },
    {
      title: '过期时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
      width: 160,
      render: (time?: string) => {
        if (!time) return <Text type="secondary">永久有效</Text>
        const isExpired = new Date(time) < new Date()
        return (
          <Text type={isExpired ? 'danger' : 'default'}>
            {formatDateTime(time)}
          </Text>
        )
      }
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
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="二维码">
            <Button
              type="link"
              icon={<QrcodeOutlined />}
              size="small"
              onClick={() => handleShowQRCode(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? '停用分享' : '启用分享'}>
            <Popconfirm
              title={`确定要${record.isActive ? '停用' : '启用'}这个分享吗？`}
              onConfirm={() => handleToggleShare(record)}
            >
              <Button
                type="link"
                icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="删除分享">
            <Popconfirm
              title="确定要删除这个分享吗？"
              onConfirm={() => handleDeleteShare(record.id)}
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

  // 获取分享列表
  const fetchShares = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await fileService.getFileShares({
        page: state.current,
        size: state.pageSize
      })
      
      setState(prev => ({
        ...prev,
        shares: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取分享列表失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取文件列表
  const fetchFiles = async () => {
    try {
      const response = await fileService.getFileList({
        page: 1,
        size: 100,
        status: 2 // 只获取上传成功的文件
      })
      setState(prev => ({ ...prev, files: response.data.records }))
    } catch (error) {
      message.error('获取文件列表失败')
    }
  }

  // 创建分享
  const handleCreateShare = async (values: ShareFormData) => {
    try {
      await fileService.createFileShare(values)
      message.success('创建分享成功')
      setIsCreateModalVisible(false)
      form.resetFields()
      fetchShares()
    } catch (error) {
      message.error('创建分享失败')
    }
  }

  // 查看分享详情
  const handleViewDetail = (share: FileShare) => {
    setCurrentShare(share)
    setIsDetailModalVisible(true)
  }

  // 显示二维码
  const handleShowQRCode = (share: FileShare) => {
    setCurrentShare(share)
    setIsQRModalVisible(true)
  }

  // 切换分享状态
  const handleToggleShare = async (share: FileShare) => {
    try {
      await fileService.updateFileShare(share.id, { isActive: !share.isActive } as any)
      message.success(`分享已${share.isActive ? '停用' : '启用'}`)
      fetchShares()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 删除分享
  const handleDeleteShare = async (id: number) => {
    try {
      await fileService.deleteFileShare(id)
      message.success('删除分享成功')
      fetchShares()
    } catch (error) {
      message.error('删除分享失败')
    }
  }

  // 复制分享信息
  const handleCopyShareInfo = (share: FileShare) => {
    const shareInfo = `文件名: ${share.fileName}\n分享链接: ${share.shareUrl}\n分享码: ${share.shareCode}${
      share.password ? `\n提取码: ${share.password}` : ''
    }`
    navigator.clipboard.writeText(shareInfo)
    message.success('分享信息已复制')
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
    fetchShares()
    fetchFiles()
  }, [state.current, state.pageSize])

  return (
    <div>
      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              文件分享管理
            </Title>
            <Text type="secondary">
              创建和管理文件分享链接，支持密码保护和访问限制
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                创建分享
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchShares}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 分享统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                {state.shares.length}
              </Title>
              <Text type="secondary">总分享数</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                {state.shares.filter(s => s.isActive).length}
              </Title>
              <Text type="secondary">有效分享</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#faad14' }}>
                {state.shares.reduce((sum, s) => sum + s.downloadCount, 0)}
              </Title>
              <Text type="secondary">总下载次数</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#722ed1' }}>
                {state.shares.reduce((sum, s) => sum + s.viewCount, 0)}
              </Title>
              <Text type="secondary">总访问次数</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 分享列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={state.shares}
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

      {/* 创建分享弹窗 */}
      <Modal
        title="创建文件分享"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateShare}>
          <Form.Item
            name="fileId"
            label="选择文件"
            rules={[{ required: true, message: '请选择要分享的文件' }]}
          >
            <Select
              placeholder="请选择文件"
              showSearch
              optionFilterProp="children"
            >
              {state.files.map(file => (
                <Option key={file.id} value={file.id}>
                  {file.originalName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="password" label="访问密码">
                <Input placeholder="留空表示无密码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expireHours" label="有效期（小时）">
                <InputNumber
                  placeholder="留空表示永久有效"
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="downloadLimit" label="下载次数限制">
                <InputNumber
                  placeholder="留空表示无限制"
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="viewLimit" label="访问次数限制">
                <InputNumber
                  placeholder="留空表示无限制"
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Alert
            message="分享说明"
            description="创建分享后，其他用户可以通过分享链接或分享码访问文件。建议为敏感文件设置访问密码和有效期。"
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* 分享详情弹窗 */}
      <Modal
        title="分享详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="copy" onClick={() => currentShare && handleCopyShareInfo(currentShare)}>
            复制分享信息
          </Button>,
          <Button key="close" type="primary" onClick={() => setIsDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {currentShare && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="分享信息" size="small">
                  <p><strong>文件名:</strong> {currentShare.fileName}</p>
                  <p><strong>分享码:</strong> <Text code>{currentShare.shareCode}</Text></p>
                  <p><strong>创建者:</strong> {currentShare.creatorName}</p>
                  <p><strong>创建时间:</strong> {formatDateTime(currentShare.createTime)}</p>
                  {currentShare.expireTime && (
                    <p><strong>过期时间:</strong> {formatDateTime(currentShare.expireTime)}</p>
                  )}
                  {currentShare.password && (
                    <p><strong>访问密码:</strong> <Text code>{currentShare.password}</Text></p>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="访问统计" size="small">
                  <p><strong>下载次数:</strong> {currentShare.downloadCount}
                    {currentShare.downloadLimit && ` / ${currentShare.downloadLimit}`}
                  </p>
                  <p><strong>访问次数:</strong> {currentShare.viewCount}
                    {currentShare.viewLimit && ` / ${currentShare.viewLimit}`}
                  </p>
                  <p><strong>状态:</strong> 
                    <Tag color={currentShare.isActive ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                      {currentShare.isActive ? '有效' : '已停用'}
                    </Tag>
                  </p>
                </Card>
              </Col>
            </Row>

            <Divider />

            <div>
              <Title level={5}>分享链接</Title>
              <Input
                value={currentShare.shareUrl}
                readOnly
                addonAfter={
                  <Button
                    type="link"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(currentShare.shareUrl)
                      message.success('链接已复制')
                    }}
                  >
                    复制
                  </Button>
                }
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 二维码弹窗 */}
      <Modal
        title="分享二维码"
        open={isQRModalVisible}
        onCancel={() => setIsQRModalVisible(false)}
        footer={null}
        width={400}
      >
        {currentShare && (
          <div style={{ textAlign: 'center' }}>
            <QRCode
              value={currentShare.shareUrl}
              size={256}
              style={{ marginBottom: 16 }}
            />
            <div>
              <Text strong>{currentShare.fileName}</Text>
              <br />
              <Text type="secondary">扫码访问分享链接</Text>
              {currentShare.password && (
                <div style={{ marginTop: 16 }}>
                  <Alert
                    message={`访问密码: ${currentShare.password}`}
                    type="info"
                    showIcon
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default FileShareComponent