import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Row,
  Col,
  Tag,
  Tooltip,
  Typography,
  Progress,
  Tree,
  Drawer,
  Image,
  Descriptions,
  Upload,
  Checkbox,
  Dropdown,
  Menu,
  Alert,
  Empty,
  Breadcrumb
} from 'antd'
import {
  FolderOutlined,
  FileOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  ShareAltOutlined,
  CopyOutlined,
  ScissorOutlined,
  FolderAddOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  MoreOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileZipOutlined,
  FileVideoOutlined,
  FileTextOutlined,
  TagOutlined,
  LockOutlined,
  UnlockOutlined,
  HomeOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'
import { FileRecord, FolderRecord, FileType, FileStatus } from '@/types'
import { fileService } from '@/services'
import { formatDateTime, formatFileSize } from '@/utils'

const { Option } = Select
const { Search } = Input
const { Text, Title } = Typography
const { confirm } = Modal

interface FileListState {
  files: FileRecord[]
  folders: FolderRecord[]
  folderTree: FolderRecord[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  selectedIds: number[]
  currentFolderId?: number
  currentFolderPath: FolderRecord[]
}

interface SearchParams {
  fileName?: string
  fileType?: FileType
  status?: FileStatus
  folderId?: number
  tags?: string[]
}

const FileList: React.FC = () => {
  const [form] = Form.useForm()
  const [state, setState] = useState<FileListState>({
    files: [],
    folders: [],
    folderTree: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 20,
    selectedIds: [],
    currentFolderPath: []
  })
  
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [currentFile, setCurrentFile] = useState<FileRecord | null>(null)
  const [isPreviewDrawerVisible, setIsPreviewDrawerVisible] = useState(false)
  const [isFolderModalVisible, setIsFolderModalVisible] = useState(false)
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false)
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // 获取文件类型图标
  const getFileIcon = (file: FileRecord) => {
    const iconMap = {
      [FileType.IMAGE]: <FileImageOutlined style={{ color: '#52c41a' }} />,
      [FileType.DOCUMENT]: getDocumentIcon(file.mimeType),
      [FileType.VIDEO]: <FileVideoOutlined style={{ color: '#722ed1' }} />,
      [FileType.AUDIO]: <FileOutlined style={{ color: '#fa8c16' }} />,
      [FileType.ARCHIVE]: <FileZipOutlined style={{ color: '#faad14' }} />,
      [FileType.OTHER]: <FileOutlined style={{ color: '#666' }} />
    }
    return iconMap[file.fileType] || <FileOutlined />
  }

  // 获取文档类型图标
  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />
    if (mimeType.includes('word')) return <FileWordOutlined style={{ color: '#1890ff' }} />
    if (mimeType.includes('excel')) return <FileExcelOutlined style={{ color: '#52c41a' }} />
    if (mimeType.includes('powerpoint')) return <FilePptOutlined style={{ color: '#fa8c16' }} />
    if (mimeType.includes('text')) return <FileTextOutlined style={{ color: '#666' }} />
    return <FileOutlined style={{ color: '#666' }} />
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

  // 获取文件状态标签
  const getStatusTag = (status: FileStatus) => {
    const statusMap = {
      [FileStatus.UPLOADING]: { color: 'processing', text: '上传中' },
      [FileStatus.SUCCESS]: { color: 'success', text: '正常' },
      [FileStatus.FAILED]: { color: 'error', text: '失败' },
      [FileStatus.PROCESSING]: { color: 'warning', text: '处理中' },
      [FileStatus.DELETED]: { color: 'default', text: '已删除' }
    }
    const statusInfo = statusMap[status]
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
  }

  // 表格列定义
  const columns: ColumnsType<FileRecord> = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 300,
      render: (name, record) => (
        <Space>
          <Checkbox
            checked={state.selectedIds.includes(record.id)}
            onChange={(e) => handleSelectFile(record.id, e.target.checked)}
          />
          {getFileIcon(record)}
          <Button
            type="link"
            size="small"
            onClick={() => handlePreviewFile(record)}
            style={{ padding: 0, height: 'auto' }}
          >
            <Text ellipsis style={{ maxWidth: 200 }}>
              {record.originalName}
            </Text>
          </Button>
          {!record.isPublic && <LockOutlined style={{ color: '#faad14' }} />}
        </Space>
      )
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: FileStatus) => getStatusTag(status)
    },
    {
      title: '上传者',
      dataIndex: 'uploaderName',
      key: 'uploaderName',
      width: 120,
      ellipsis: true
    },
    {
      title: '下载次数',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      width: 80,
      sorter: true
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <Space wrap>
          {tags?.slice(0, 2).map(tag => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
          {tags && tags.length > 2 && (
            <Tag size="small">+{tags.length - 2}</Tag>
          )}
        </Space>
      )
    },
    {
      title: '上传时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => formatDateTime(time),
      sorter: true
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handlePreviewFile(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="link"
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => handleDownloadFile(record)}
            />
          </Tooltip>
          <Tooltip title="分享">
            <Button
              type="link"
              icon={<ShareAltOutlined />}
              size="small"
              onClick={() => handleShareFile(record)}
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item 
                  key="rename" 
                  icon={<EditOutlined />}
                  onClick={() => handleRenameFile(record)}
                >
                  重命名
                </Menu.Item>
                <Menu.Item 
                  key="move" 
                  icon={<ScissorOutlined />}
                  onClick={() => handleMoveFile(record)}
                >
                  移动
                </Menu.Item>
                <Menu.Item 
                  key="copy" 
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyFile(record)}
                >
                  复制
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  key="delete" 
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => handleDeleteFile(record)}
                >
                  删除
                </Menu.Item>
              </Menu>
            }
          >
            <Button type="link" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      )
    }
  ]

  // 获取文件夹树数据
  const getFolderTreeData = (): DataNode[] => {
    const convertToTreeData = (folders: FolderRecord[]): DataNode[] => {
      return folders.map(folder => ({
        key: folder.id,
        title: folder.name,
        icon: <FolderOutlined />,
        children: folder.children ? convertToTreeData(folder.children) : undefined
      }))
    }
    return convertToTreeData(state.folderTree)
  }

  // 获取文件列表
  const fetchFiles = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await fileService.getFileList({
        ...searchParams,
        folderId: state.currentFolderId,
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
      message.error('获取文件列表失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取文件夹列表
  const fetchFolders = async () => {
    try {
      const response = await fileService.getFolderList({
        parentId: state.currentFolderId,
        page: 1,
        size: 100
      })
      setState(prev => ({ ...prev, folders: response.data.records }))
    } catch (error) {
      message.error('获取文件夹列表失败')
    }
  }

  // 获取文件夹树
  const fetchFolderTree = async () => {
    try {
      const response = await fileService.getFolderTree()
      setState(prev => ({ ...prev, folderTree: response.data }))
    } catch (error) {
      message.error('获取文件夹树失败')
    }
  }

  // 进入文件夹
  const handleEnterFolder = async (folderId: number) => {
    try {
      const response = await fileService.getFolderById(folderId)
      const folder = response.data
      
      // 构建路径
      const newPath = [...state.currentFolderPath, folder]
      
      setState(prev => ({
        ...prev,
        currentFolderId: folderId,
        currentFolderPath: newPath,
        current: 1,
        selectedIds: []
      }))
    } catch (error) {
      message.error('进入文件夹失败')
    }
  }

  // 返回上级文件夹
  const handleGoBack = () => {
    const newPath = state.currentFolderPath.slice(0, -1)
    const parentFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : undefined
    
    setState(prev => ({
      ...prev,
      currentFolderId: parentFolderId,
      currentFolderPath: newPath,
      current: 1,
      selectedIds: []
    }))
  }

  // 返回根目录
  const handleGoHome = () => {
    setState(prev => ({
      ...prev,
      currentFolderId: undefined,
      currentFolderPath: [],
      current: 1,
      selectedIds: []
    }))
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

  // 预览文件
  const handlePreviewFile = (file: FileRecord) => {
    setCurrentFile(file)
    setIsPreviewDrawerVisible(true)
  }

  // 下载文件
  const handleDownloadFile = async (file: FileRecord) => {
    try {
      const response = await fileService.downloadFile(file.id)
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = file.originalName
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('下载成功')
    } catch (error) {
      message.error('下载失败')
    }
  }

  // 分享文件
  const handleShareFile = (file: FileRecord) => {
    message.info('分享功能开发中...')
  }

  // 重命名文件
  const handleRenameFile = (file: FileRecord) => {
    setCurrentFile(file)
    form.setFieldsValue({ name: file.originalName })
    setIsRenameModalVisible(true)
  }

  // 移动文件
  const handleMoveFile = (file: FileRecord) => {
    setCurrentFile(file)
    setIsMoveModalVisible(true)
  }

  // 复制文件
  const handleCopyFile = async (file: FileRecord) => {
    try {
      await fileService.copyFiles([file.id], state.currentFolderId)
      message.success('复制成功')
      fetchFiles()
    } catch (error) {
      message.error('复制失败')
    }
  }

  // 删除文件
  const handleDeleteFile = (file: FileRecord) => {
    confirm({
      title: '确认删除',
      content: `确定要删除文件 "${file.originalName}" 吗？`,
      onOk: async () => {
        try {
          await fileService.deleteFile(file.id)
          message.success('删除成功')
          fetchFiles()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  // 批量删除
  const handleBatchDelete = () => {
    if (state.selectedIds.length === 0) {
      message.warning('请选择要删除的文件')
      return
    }

    confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${state.selectedIds.length} 个文件吗？`,
      onOk: async () => {
        try {
          await fileService.batchDeleteFiles(state.selectedIds)
          message.success('批量删除成功')
          setState(prev => ({ ...prev, selectedIds: [] }))
          fetchFiles()
        } catch (error) {
          message.error('批量删除失败')
        }
      }
    })
  }

  // 创建文件夹
  const handleCreateFolder = async (values: any) => {
    try {
      await fileService.createFolder({
        ...values,
        parentId: state.currentFolderId
      })
      message.success('创建文件夹成功')
      setIsFolderModalVisible(false)
      form.resetFields()
      fetchFolders()
      fetchFolderTree()
    } catch (error) {
      message.error('创建文件夹失败')
    }
  }

  // 搜索
  const handleSearch = (keyword: string) => {
    setSearchParams(prev => ({ ...prev, fileName: keyword }))
    setState(prev => ({ ...prev, current: 1 }))
  }

  // 表格变化处理
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  useEffect(() => {
    fetchFiles()
    fetchFolders()
  }, [state.current, state.pageSize, state.currentFolderId, searchParams])

  useEffect(() => {
    fetchFolderTree()
  }, [])

  return (
    <div>
      {/* 工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} justify="space-between" align="middle">
          <Col flex="auto">
            <Space>
              {/* 面包屑导航 */}
              <Breadcrumb>
                <Breadcrumb.Item>
                  <Button 
                    type="link" 
                    icon={<HomeOutlined />} 
                    onClick={handleGoHome}
                    style={{ padding: 0 }}
                  >
                    根目录
                  </Button>
                </Breadcrumb.Item>
                {state.currentFolderPath.map((folder, index) => (
                  <Breadcrumb.Item key={folder.id}>
                    <Button
                      type="link"
                      onClick={() => {
                        const targetPath = state.currentFolderPath.slice(0, index + 1)
                        setState(prev => ({
                          ...prev,
                          currentFolderId: folder.id,
                          currentFolderPath: targetPath,
                          current: 1,
                          selectedIds: []
                        }))
                      }}
                      style={{ padding: 0 }}
                    >
                      {folder.name}
                    </Button>
                  </Breadcrumb.Item>
                ))}
              </Breadcrumb>
            </Space>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder="搜索文件"
                onSearch={handleSearch}
                style={{ width: 200 }}
              />
              <Button
                icon={<FolderAddOutlined />}
                onClick={() => setIsFolderModalVisible(true)}
              >
                新建文件夹
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchFiles}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 文件夹列表 */}
      {state.folders.length > 0 && (
        <Card title="文件夹" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            {state.folders.map(folder => (
              <Col key={folder.id} span={6} style={{ marginBottom: 16 }}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => handleEnterFolder(folder.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Space>
                    <FolderOutlined style={{ fontSize: 20, color: '#faad14' }} />
                    <div>
                      <Text strong>{folder.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {folder.fileCount} 个文件
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 批量操作栏 */}
      {state.selectedIds.length > 0 && (
        <Alert
          message={
            <Space>
              <span>已选择 {state.selectedIds.length} 个文件</span>
              <Button size="small" onClick={() => setState(prev => ({ ...prev, selectedIds: [] }))}>
                取消选择
              </Button>
              <Button size="small" onClick={handleBatchDelete} danger>
                批量删除
              </Button>
            </Space>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 文件列表 */}
      <Card>
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
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 文件预览抽屉 */}
      <Drawer
        title="文件预览"
        placement="right"
        onClose={() => setIsPreviewDrawerVisible(false)}
        open={isPreviewDrawerVisible}
        width={600}
      >
        {currentFile && (
          <div>
            <Descriptions title="文件信息" bordered column={1}>
              <Descriptions.Item label="文件名">
                {currentFile.originalName}
              </Descriptions.Item>
              <Descriptions.Item label="文件大小">
                {formatFileSize(currentFile.fileSize)}
              </Descriptions.Item>
              <Descriptions.Item label="文件类型">
                {getFileTypeName(currentFile.fileType)}
              </Descriptions.Item>
              <Descriptions.Item label="上传者">
                {currentFile.uploaderName}
              </Descriptions.Item>
              <Descriptions.Item label="上传时间">
                {formatDateTime(currentFile.createTime)}
              </Descriptions.Item>
              <Descriptions.Item label="下载次数">
                {currentFile.downloadCount}
              </Descriptions.Item>
              {currentFile.tags && currentFile.tags.length > 0 && (
                <Descriptions.Item label="标签">
                  <Space wrap>
                    {currentFile.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
              {currentFile.description && (
                <Descriptions.Item label="描述">
                  {currentFile.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* 图片预览 */}
            {currentFile.fileType === FileType.IMAGE && currentFile.thumbnailPath && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Image
                  src={currentFile.thumbnailPath}
                  alt={currentFile.originalName}
                  style={{ maxWidth: '100%' }}
                />
              </div>
            )}

            {/* 操作按钮 */}
            <div style={{ marginTop: 16 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadFile(currentFile)}
                >
                  下载
                </Button>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={() => handleShareFile(currentFile)}
                >
                  分享
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* 创建文件夹弹窗 */}
      <Modal
        title="新建文件夹"
        open={isFolderModalVisible}
        onCancel={() => setIsFolderModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateFolder}>
          <Form.Item
            name="name"
            label="文件夹名称"
            rules={[{ required: true, message: '请输入文件夹名称' }]}
          >
            <Input placeholder="请输入文件夹名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入文件夹描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重命名弹窗 */}
      <Modal
        title="重命名文件"
        open={isRenameModalVisible}
        onCancel={() => setIsRenameModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="文件名"
            rules={[{ required: true, message: '请输入文件名' }]}
          >
            <Input placeholder="请输入文件名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FileList