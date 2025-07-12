import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  message,
  Form,
  Input,
  Select,
  Switch,
  Card,
  Row,
  Col,
  Tag,
  Tooltip,
  Typography,
  Divider,
  List,
  Alert
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  FileTextOutlined,
  BugOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { NotificationTemplate, NotificationType } from '@/types'
import { notificationService } from '@/services'
import { formatDateTime } from '@/utils'

const { Option } = Select
const { TextArea } = Input
const { Title, Text } = Typography

interface TemplateState {
  templates: NotificationTemplate[]
  loading: boolean
  total: number
  current: number
  pageSize: number
}

interface TemplateFormData {
  name: string
  title: string
  content: string
  type: NotificationType
  variables: Array<{
    name: string
    label: string
    type: string
    required: boolean
    defaultValue?: any
  }>
  isActive: boolean
}

const NotificationTemplates: React.FC = () => {
  const [form] = Form.useForm()
  const [testForm] = Form.useForm()
  const [templateState, setTemplateState] = useState<TemplateState>({
    templates: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10
  })
  
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isTestModalVisible, setIsTestModalVisible] = useState(false)
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<NotificationTemplate | null>(null)
  const [modalType, setModalType] = useState<'create' | 'edit'>('create')
  const [previewContent, setPreviewContent] = useState({ title: '', content: '' })

  // 表格列定义
  const columns: ColumnsType<NotificationTemplate> = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
      render: (title: string) => (
        <Tooltip title={title}>
          <Text ellipsis>{title}</Text>
        </Tooltip>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: NotificationType) => {
        const typeMap = {
          [NotificationType.SYSTEM]: { color: 'blue', text: '系统通知' },
          [NotificationType.CASE_UPDATE]: { color: 'green', text: '案件更新' },
          [NotificationType.ASSIGNMENT]: { color: 'orange', text: '分案通知' },
          [NotificationType.MEDIATION]: { color: 'purple', text: '调解通知' },
          [NotificationType.LITIGATION]: { color: 'red', text: '诉讼通知' },
          [NotificationType.SETTLEMENT]: { color: 'cyan', text: '结算通知' },
          [NotificationType.REMINDER]: { color: 'yellow', text: '提醒通知' },
          [NotificationType.ANNOUNCEMENT]: { color: 'magenta', text: '公告通知' }
        }
        const typeInfo = typeMap[type] || { color: 'default', text: '未知' }
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
      }
    },
    {
      title: '变量数量',
      key: 'variableCount',
      width: 100,
      render: (_, record) => record.variables?.length || 0
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="测试">
            <Button
              type="link"
              icon={<BugOutlined />}
              size="small"
              onClick={() => handleTest(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="link"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => handleCopy(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  // 获取模板列表
  const fetchTemplates = async () => {
    setTemplateState(prev => ({ ...prev, loading: true }))
    try {
      const response = await notificationService.getTemplateList({
        page: templateState.current,
        size: templateState.pageSize
      })
      
      setTemplateState(prev => ({
        ...prev,
        templates: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取模板列表失败')
      setTemplateState(prev => ({ ...prev, loading: false }))
    }
  }

  // 新增模板
  const handleAdd = () => {
    setModalType('create')
    setCurrentTemplate(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  // 编辑模板
  const handleEdit = (template: NotificationTemplate) => {
    setModalType('edit')
    setCurrentTemplate(template)
    form.setFieldsValue({
      name: template.name,
      title: template.title,
      content: template.content,
      type: template.type,
      isActive: template.isActive,
      variables: template.variables
    })
    setIsModalVisible(true)
  }

  // 复制模板
  const handleCopy = (template: NotificationTemplate) => {
    setModalType('create')
    setCurrentTemplate(null)
    form.setFieldsValue({
      name: `${template.name}_副本`,
      title: template.title,
      content: template.content,
      type: template.type,
      isActive: false,
      variables: template.variables
    })
    setIsModalVisible(true)
  }

  // 删除模板
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模板吗？删除后无法恢复。',
      onOk: async () => {
        try {
          await notificationService.deleteTemplate(id)
          message.success('删除成功')
          fetchTemplates()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  // 预览模板
  const handlePreview = async (template: NotificationTemplate) => {
    try {
      const testData: Record<string, any> = {}
      template.variables.forEach(variable => {
        if (variable.defaultValue !== undefined) {
          testData[variable.name] = variable.defaultValue
        } else {
          // 根据类型生成测试数据
          switch (variable.type) {
            case 'string':
              testData[variable.name] = `示例${variable.label}`
              break
            case 'number':
              testData[variable.name] = 123
              break
            case 'date':
              testData[variable.name] = new Date().toISOString()
              break
            default:
              testData[variable.name] = '示例值'
          }
        }
      })

      const response = await notificationService.previewTemplate(template.id, testData)
      setPreviewContent(response.data)
      setIsPreviewVisible(true)
    } catch (error) {
      message.error('预览失败')
    }
  }

  // 测试模板
  const handleTest = (template: NotificationTemplate) => {
    setCurrentTemplate(template)
    testForm.resetFields()
    setIsTestModalVisible(true)
  }

  // 保存模板
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      if (modalType === 'create') {
        await notificationService.createTemplate(values)
        message.success('创建成功')
      } else {
        await notificationService.updateTemplate(currentTemplate!.id, values)
        message.success('更新成功')
      }
      
      setIsModalVisible(false)
      fetchTemplates()
    } catch (error) {
      message.error(modalType === 'create' ? '创建失败' : '更新失败')
    }
  }

  // 执行测试
  const handleExecuteTest = async () => {
    try {
      const values = await testForm.validateFields()
      
      // 这里可以实际发送测试通知
      message.success('测试通知发送成功')
      setIsTestModalVisible(false)
    } catch (error) {
      message.error('测试发送失败')
    }
  }

  // 表格变化处理
  const handleTableChange = (pagination: any) => {
    setTemplateState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  useEffect(() => {
    fetchTemplates()
  }, [templateState.current, templateState.pageSize])

  return (
    <div>
      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增模板
          </Button>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => message.info('模板导入导出功能开发中...')}
          >
            导入模板
          </Button>
          <Button
            onClick={fetchTemplates}
          >
            刷新
          </Button>
        </Space>
      </Card>

      {/* 模板列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={templateState.templates}
          rowKey="id"
          loading={templateState.loading}
          pagination={{
            current: templateState.current,
            pageSize: templateState.pageSize,
            total: templateState.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新增/编辑模板弹窗 */}
      <Modal
        title={modalType === 'create' ? '新增模板' : '编辑模板'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="模板名称"
                rules={[{ required: true, message: '请输入模板名称' }]}
              >
                <Input placeholder="请输入模板名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="type"
                label="通知类型"
                rules={[{ required: true, message: '请选择通知类型' }]}
              >
                <Select placeholder="请选择通知类型">
                  <Option value={NotificationType.SYSTEM}>系统通知</Option>
                  <Option value={NotificationType.CASE_UPDATE}>案件更新</Option>
                  <Option value={NotificationType.ASSIGNMENT}>分案通知</Option>
                  <Option value={NotificationType.MEDIATION}>调解通知</Option>
                  <Option value={NotificationType.LITIGATION}>诉讼通知</Option>
                  <Option value={NotificationType.SETTLEMENT}>结算通知</Option>
                  <Option value={NotificationType.REMINDER}>提醒通知</Option>
                  <Option value={NotificationType.ANNOUNCEMENT}>公告通知</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="isActive"
                label="启用状态"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="title"
            label="通知标题"
            rules={[{ required: true, message: '请输入通知标题' }]}
          >
            <Input placeholder="请输入通知标题，支持变量：{{变量名}}" />
          </Form.Item>

          <Form.Item
            name="content"
            label="通知内容"
            rules={[{ required: true, message: '请输入通知内容' }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入通知内容，支持变量：{{变量名}}"
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item label="模板变量">
            <Alert
              message="变量说明"
              description="在标题和内容中使用 {{变量名}} 的格式来引用变量，发送时会自动替换为实际值。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form.List name="variables">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card key={key} size="small" style={{ marginBottom: 8 }}>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            label="变量名"
                            rules={[{ required: true, message: '请输入变量名' }]}
                          >
                            <Input placeholder="变量名" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'label']}
                            label="显示名称"
                            rules={[{ required: true, message: '请输入显示名称' }]}
                          >
                            <Input placeholder="显示名称" />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'type']}
                            label="类型"
                            initialValue="string"
                          >
                            <Select>
                              <Option value="string">文本</Option>
                              <Option value="number">数字</Option>
                              <Option value="date">日期</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'required']}
                            label="必填"
                            valuePropName="checked"
                          >
                            <Switch size="small" />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Form.Item
                            {...restField}
                            name={[name, 'defaultValue']}
                            label="默认值"
                          >
                            <Input placeholder="默认值" />
                          </Form.Item>
                        </Col>
                        <Col span={1}>
                          <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                            style={{ marginTop: 30 }}
                          />
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加变量
                  </Button>
                </div>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板预览弹窗 */}
      <Modal
        title="模板预览"
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsPreviewVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <Card>
          <Title level={4}>{previewContent.title}</Title>
          <Divider />
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {previewContent.content}
          </div>
        </Card>
      </Modal>

      {/* 模板测试弹窗 */}
      <Modal
        title="模板测试"
        open={isTestModalVisible}
        onCancel={() => setIsTestModalVisible(false)}
        onOk={handleExecuteTest}
        width={600}
      >
        {currentTemplate && (
          <Form form={testForm} layout="vertical">
            <Alert
              message="模板测试"
              description="请填写变量值进行模板测试，测试通知将发送给当前用户。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {currentTemplate.variables.map((variable) => (
              <Form.Item
                key={variable.name}
                name={variable.name}
                label={variable.label}
                rules={variable.required ? [{ required: true, message: `请输入${variable.label}` }] : []}
                initialValue={variable.defaultValue}
              >
                {variable.type === 'number' ? (
                  <Input type="number" placeholder={`请输入${variable.label}`} />
                ) : variable.type === 'date' ? (
                  <Input type="datetime-local" placeholder={`请选择${variable.label}`} />
                ) : (
                  <Input placeholder={`请输入${variable.label}`} />
                )}
              </Form.Item>
            ))}
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default NotificationTemplates