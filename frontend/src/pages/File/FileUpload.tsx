import React, { useState, useEffect } from 'react'
import {
  Card,
  Upload,
  Button,
  Space,
  message,
  Progress,
  List,
  Typography,
  Tag,
  Alert,
  Row,
  Col,
  Form,
  Input,
  Select,
  Switch,
  TreeSelect,
  Modal,
  Steps,
  Tooltip,
  Divider
} from 'antd'
import {
  UploadOutlined,
  InboxOutlined,
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileOutlined,
  FolderOutlined,
  SettingOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload'
import { FolderRecord, UploadConfig, FileType } from '@/types'
import { fileService } from '@/services'
import { formatFileSize } from '@/utils'

const { Dragger } = Upload
const { Option } = Select
const { TextArea } = Input
const { Text, Title } = Typography
const { Step } = Steps

interface UploadState {
  fileList: UploadFile[]
  uploading: boolean
  uploadProgress: Record<string, number>
  currentStep: number
  config: UploadConfig | null
  folderTree: Array<{ label: string; value: number; children?: any[] }>
  selectedFolder?: number
  uploadOptions: {
    tags: string[]
    description: string
    isPublic: boolean
    expireDays?: number
  }
}

interface FileUploadItem extends UploadFile {
  status: 'waiting' | 'uploading' | 'success' | 'error' | 'paused'
  progress?: number
  error?: string
  fileType?: FileType
  hash?: string
}

const FileUpload: React.FC = () => {
  const [form] = Form.useForm()
  const [state, setState] = useState<UploadState>({
    fileList: [],
    uploading: false,
    uploadProgress: {},
    currentStep: 0,
    config: null,
    folderTree: [],
    uploadOptions: {
      tags: [],
      description: '',
      isPublic: false
    }
  })

  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false)

  // 获取上传配置
  const fetchUploadConfig = async () => {
    try {
      const response = await fileService.getUploadConfig()
      setState(prev => ({ ...prev, config: response.data }))
    } catch (error) {
      message.error('获取上传配置失败')
    }
  }

  // 获取文件夹树
  const fetchFolderTree = async () => {
    try {
      const response = await fileService.getFolderTree()
      const treeData = convertToTreeSelect(response.data)
      setState(prev => ({ ...prev, folderTree: treeData }))
    } catch (error) {
      message.error('获取文件夹列表失败')
    }
  }

  // 转换为TreeSelect数据格式
  const convertToTreeSelect = (folders: FolderRecord[]): any[] => {
    return folders.map(folder => ({
      label: folder.name,
      value: folder.id,
      children: folder.children ? convertToTreeSelect(folder.children) : undefined
    }))
  }

  // 获取文件类型
  const getFileType = (file: File): FileType => {
    const mimeType = file.type
    if (mimeType.startsWith('image/')) return FileType.IMAGE
    if (mimeType.startsWith('video/')) return FileType.VIDEO
    if (mimeType.startsWith('audio/')) return FileType.AUDIO
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return FileType.ARCHIVE
    if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('powerpoint') || mimeType.includes('text')) return FileType.DOCUMENT
    return FileType.OTHER
  }

  // 文件上传前检查
  const beforeUpload = (file: File): boolean => {
    if (!state.config) {
      message.error('上传配置未加载')
      return false
    }

    // 检查文件大小
    if (file.size > state.config.maxFileSize) {
      message.error(`文件大小不能超过 ${formatFileSize(state.config.maxFileSize)}`)
      return false
    }

    // 检查文件类型
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (fileExt && !state.config.allowedTypes.includes(fileExt)) {
      message.error(`不支持的文件类型: ${fileExt}`)
      return false
    }

    return true
  }

  // 文件选择变化
  const handleFileChange: UploadProps['onChange'] = (info) => {
    const { fileList } = info
    
    // 添加文件类型信息
    const updatedFileList = fileList.map(file => ({
      ...file,
      fileType: file.originFileObj ? getFileType(file.originFileObj) : undefined
    }))

    setState(prev => ({ ...prev, fileList: updatedFileList }))
  }

  // 移除文件
  const handleRemoveFile = (file: UploadFile) => {
    setState(prev => ({
      ...prev,
      fileList: prev.fileList.filter(item => item.uid !== file.uid)
    }))
  }

  // 开始上传
  const handleStartUpload = async () => {
    if (state.fileList.length === 0) {
      message.warning('请先选择文件')
      return
    }

    setState(prev => ({ ...prev, uploading: true, currentStep: 1 }))

    try {
      const uploadPromises = state.fileList.map(async (file) => {
        if (!file.originFileObj) return

        try {
          await fileService.uploadFile({
            file: file.originFileObj,
            folderId: state.selectedFolder,
            tags: state.uploadOptions.tags,
            description: state.uploadOptions.description,
            isPublic: state.uploadOptions.isPublic,
            expireDays: state.uploadOptions.expireDays
          }, (percent) => {
            setState(prev => ({
              ...prev,
              uploadProgress: {
                ...prev.uploadProgress,
                [file.uid]: percent
              }
            }))
          })

          // 更新文件状态为成功
          setState(prev => ({
            ...prev,
            fileList: prev.fileList.map(item =>
              item.uid === file.uid
                ? { ...item, status: 'done' }
                : item
            )
          }))

        } catch (error) {
          // 更新文件状态为失败
          setState(prev => ({
            ...prev,
            fileList: prev.fileList.map(item =>
              item.uid === file.uid
                ? { ...item, status: 'error' }
                : item
            )
          }))
        }
      })

      await Promise.all(uploadPromises)
      setState(prev => ({ ...prev, uploading: false, currentStep: 2 }))
      message.success('上传完成')

    } catch (error) {
      setState(prev => ({ ...prev, uploading: false }))
      message.error('上传失败')
    }
  }

  // 批量上传
  const handleBatchUpload = async () => {
    if (state.fileList.length === 0) {
      message.warning('请先选择文件')
      return
    }

    setState(prev => ({ ...prev, uploading: true }))

    try {
      const files = state.fileList
        .map(item => item.originFileObj)
        .filter(Boolean) as File[]

      await fileService.batchUploadFiles({
        files,
        folderId: state.selectedFolder,
        tags: state.uploadOptions.tags,
        isPublic: state.uploadOptions.isPublic
      }, (percent) => {
        setState(prev => ({ ...prev, uploadProgress: { batch: percent } }))
      })

      message.success('批量上传成功')
      setState(prev => ({
        ...prev,
        uploading: false,
        currentStep: 2,
        fileList: prev.fileList.map(item => ({ ...item, status: 'done' }))
      }))

    } catch (error) {
      setState(prev => ({ ...prev, uploading: false }))
      message.error('批量上传失败')
    }
  }

  // 重置上传
  const handleReset = () => {
    setState(prev => ({
      ...prev,
      fileList: [],
      uploading: false,
      uploadProgress: {},
      currentStep: 0
    }))
    form.resetFields()
  }

  // 获取文件类型图标
  const getFileTypeIcon = (fileType?: FileType) => {
    const iconMap = {
      [FileType.IMAGE]: '🖼️',
      [FileType.DOCUMENT]: '📄',
      [FileType.VIDEO]: '🎥',
      [FileType.AUDIO]: '🎵',
      [FileType.ARCHIVE]: '📦',
      [FileType.OTHER]: '📁'
    }
    return iconMap[fileType || FileType.OTHER]
  }

  // 获取文件状态颜色
  const getStatusColor = (status?: string) => {
    const colorMap: Record<string, string> = {
      uploading: '#1890ff',
      done: '#52c41a',
      error: '#ff4d4f',
      removed: '#d9d9d9'
    }
    return colorMap[status || 'default'] || '#d9d9d9'
  }

  useEffect(() => {
    fetchUploadConfig()
    fetchFolderTree()
  }, [])

  const steps = [
    {
      title: '选择文件',
      description: '选择要上传的文件'
    },
    {
      title: '上传中',
      description: '文件正在上传'
    },
    {
      title: '上传完成',
      description: '所有文件上传完成'
    }
  ]

  return (
    <div>
      {/* 上传配置信息 */}
      {state.config && (
        <Alert
          message="上传限制"
          description={
            <div>
              <p>单文件大小限制: {formatFileSize(state.config.maxFileSize)}</p>
              <p>支持的文件类型: {state.config.allowedTypes.join(', ')}</p>
              <p>分片大小: {formatFileSize(state.config.chunkSize)}</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button
              size="small"
              icon={<SettingOutlined />}
              onClick={() => setIsConfigModalVisible(true)}
            >
              配置
            </Button>
          }
        />
      )}

      {/* 步骤指示器 */}
      <Card style={{ marginBottom: 16 }}>
        <Steps current={state.currentStep}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} description={item.description} />
          ))}
        </Steps>
      </Card>

      <Row gutter={16}>
        {/* 左侧：文件选择和配置 */}
        <Col span={12}>
          <Card title="文件选择" style={{ marginBottom: 16 }}>
            <Dragger
              multiple
              beforeUpload={beforeUpload}
              onChange={handleFileChange}
              fileList={state.fileList}
              onRemove={handleRemoveFile}
              showUploadList={false}
              disabled={state.uploading}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持单个或批量上传，请不要上传敏感数据
              </p>
            </Dragger>

            <Divider />

            <Form form={form} layout="vertical">
              <Form.Item label="目标文件夹">
                <TreeSelect
                  placeholder="选择文件夹（默认根目录）"
                  treeData={state.folderTree}
                  allowClear
                  onChange={(value) => setState(prev => ({ ...prev, selectedFolder: value }))}
                />
              </Form.Item>

              <Form.Item label="文件标签">
                <Select
                  mode="tags"
                  placeholder="添加标签"
                  style={{ width: '100%' }}
                  onChange={(tags) => setState(prev => ({
                    ...prev,
                    uploadOptions: { ...prev.uploadOptions, tags }
                  }))}
                />
              </Form.Item>

              <Form.Item label="文件描述">
                <TextArea
                  placeholder="请输入文件描述"
                  rows={3}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    uploadOptions: { ...prev.uploadOptions, description: e.target.value }
                  }))}
                />
              </Form.Item>

              <Form.Item label="公开设置">
                <Switch
                  checkedChildren="公开"
                  unCheckedChildren="私有"
                  onChange={(checked) => setState(prev => ({
                    ...prev,
                    uploadOptions: { ...prev.uploadOptions, isPublic: checked }
                  }))}
                />
              </Form.Item>

              <Form.Item label="过期天数">
                <Select
                  placeholder="选择过期时间"
                  allowClear
                  onChange={(days) => setState(prev => ({
                    ...prev,
                    uploadOptions: { ...prev.uploadOptions, expireDays: days }
                  }))}
                >
                  <Option value={7}>7天</Option>
                  <Option value={30}>30天</Option>
                  <Option value={90}>90天</Option>
                  <Option value={365}>1年</Option>
                </Select>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧：文件列表和上传进度 */}
        <Col span={12}>
          <Card 
            title={`文件列表 (${state.fileList.length})`}
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  loading={state.uploading}
                  onClick={handleStartUpload}
                  disabled={state.fileList.length === 0}
                >
                  开始上传
                </Button>
                <Button
                  icon={<UploadOutlined />}
                  loading={state.uploading}
                  onClick={handleBatchUpload}
                  disabled={state.fileList.length === 0}
                >
                  批量上传
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            }
          >
            {state.fileList.length > 0 ? (
              <List
                dataSource={state.fileList}
                renderItem={(file) => (
                  <List.Item
                    actions={[
                      <Tooltip title="移除">
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={() => handleRemoveFile(file)}
                          disabled={state.uploading}
                        />
                      </Tooltip>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ fontSize: 24 }}>
                          {getFileTypeIcon((file as FileUploadItem).fileType)}
                        </div>
                      }
                      title={
                        <Space>
                          <Text ellipsis style={{ maxWidth: 200 }}>
                            {file.name}
                          </Text>
                          <Tag color={getStatusColor(file.status)}>
                            {file.status === 'uploading' ? '上传中' :
                             file.status === 'done' ? '完成' :
                             file.status === 'error' ? '失败' : '等待'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary">
                            {file.size ? formatFileSize(file.size) : ''}
                          </Text>
                          {state.uploadProgress[file.uid] !== undefined && (
                            <Progress
                              percent={state.uploadProgress[file.uid]}
                              size="small"
                              style={{ marginTop: 4 }}
                            />
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <FileOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <p style={{ color: '#999', marginTop: 16 }}>
                  暂无文件，请先选择要上传的文件
                </p>
              </div>
            )}
          </Card>

          {/* 上传统计 */}
          {state.fileList.length > 0 && (
            <Card title="上传统计" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                      {state.fileList.length}
                    </Title>
                    <Text type="secondary">总文件数</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                      {state.fileList.filter(f => f.status === 'done').length}
                    </Title>
                    <Text type="secondary">已完成</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
                      {state.fileList.filter(f => f.status === 'error').length}
                    </Title>
                    <Text type="secondary">失败</Text>
                  </div>
                </Col>
              </Row>

              <div style={{ marginTop: 16 }}>
                <Text type="secondary">总大小: </Text>
                <Text strong>
                  {formatFileSize(
                    state.fileList.reduce((total, file) => total + (file.size || 0), 0)
                  )}
                </Text>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* 上传配置弹窗 */}
      <Modal
        title="上传配置"
        open={isConfigModalVisible}
        onCancel={() => setIsConfigModalVisible(false)}
        footer={null}
        width={600}
      >
        {state.config && (
          <div>
            <Title level={4}>当前配置</Title>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>最大文件大小:</strong> {formatFileSize(state.config.maxFileSize)}</p>
                <p><strong>分片大小:</strong> {formatFileSize(state.config.chunkSize)}</p>
                <p><strong>并发数:</strong> {state.config.concurrent}</p>
              </Col>
              <Col span={12}>
                <p><strong>自动缩略图:</strong> {state.config.autoThumbnail ? '是' : '否'}</p>
                <p><strong>自动预览:</strong> {state.config.autoPreview ? '是' : '否'}</p>
                <p><strong>存储类型:</strong> {state.config.storageType}</p>
              </Col>
            </Row>
            <div>
              <p><strong>支持的文件类型:</strong></p>
              <Space wrap>
                {state.config.allowedTypes.map(type => (
                  <Tag key={type}>{type}</Tag>
                ))}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default FileUpload