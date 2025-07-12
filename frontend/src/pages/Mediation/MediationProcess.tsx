import React, { useState, useEffect } from 'react'
import {
  Card,
  Steps,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  message,
  Modal,
  Row,
  Col,
  Descriptions,
  Timeline,
  Tag,
  Space,
  Progress,
  Alert,
  Divider
} from 'antd'
import {
  SaveOutlined,
  SendOutlined,
  PhoneOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { MediationCase, MediationStatus, DocumentTemplate } from '@/types'
import { mediationService } from '@/services'
import { formatDateTime, formatCurrency } from '@/utils'

const { Step } = Steps
const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface ProcessState {
  mediationCase: MediationCase | null
  currentStep: number
  loading: boolean
  documents: DocumentTemplate[]
  recordForm: any
}

const MediationProcess: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<ProcessState>({
    mediationCase: null,
    currentStep: 0,
    loading: false,
    documents: [],
    recordForm: null
  })
  
  const [isRecordModalVisible, setIsRecordModalVisible] = useState(false)
  const [isDocumentModalVisible, setIsDocumentModalVisible] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [form] = Form.useForm()
  const [recordForm] = Form.useForm()
  const [documentForm] = Form.useForm()

  // 调解步骤配置
  const mediationSteps = [
    {
      title: '初步联系',
      description: '联系债务人，了解基本情况',
      icon: <PhoneOutlined />
    },
    {
      title: '调解预约',
      description: '安排调解时间和地点',
      icon: <CalendarOutlined />
    },
    {
      title: '调解协商',
      description: '进行调解协商，寻找解决方案',
      icon: <FileTextOutlined />
    },
    {
      title: '协议签署',
      description: '签署调解协议书',
      icon: <CheckCircleOutlined />
    },
    {
      title: '完成调解',
      description: '调解流程结束',
      icon: <CheckCircleOutlined />
    }
  ]

  // 获取调解案件详情
  const fetchMediationCase = async () => {
    if (!id) return
    
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await mediationService.getMediationById(parseInt(id))
      setState(prev => ({ 
        ...prev, 
        mediationCase: response.data,
        currentStep: response.data.currentStep || 0,
        loading: false
      }))
      
      // 填充表单
      form.setFieldsValue(response.data)
    } catch (error) {
      message.error('获取调解案件失败')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取文书模板
  const fetchDocumentTemplates = async () => {
    try {
      const response = await mediationService.getDocumentTemplates()
      setState(prev => ({ ...prev, documents: response.data }))
    } catch (error) {
      message.error('获取文书模板失败')
    }
  }

  // 保存调解信息
  const handleSave = async () => {
    if (!state.mediationCase) return
    
    try {
      const values = await form.validateFields()
      await mediationService.updateMediationCase(state.mediationCase.id, values)
      message.success('保存成功')
      fetchMediationCase()
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 更新步骤
  const handleStepChange = async (step: number) => {
    if (!state.mediationCase) return
    
    try {
      await mediationService.updateMediationStep(state.mediationCase.id, step)
      setState(prev => ({ ...prev, currentStep: step }))
      message.success('步骤更新成功')
      fetchMediationCase()
    } catch (error) {
      message.error('步骤更新失败')
    }
  }

  // 添加调解记录
  const handleAddRecord = () => {
    recordForm.resetFields()
    setIsRecordModalVisible(true)
  }

  // 保存调解记录
  const handleSaveRecord = async () => {
    if (!state.mediationCase) return
    
    try {
      const values = await recordForm.validateFields()
      await mediationService.addMediationRecord(state.mediationCase.id, values)
      message.success('记录保存成功')
      setIsRecordModalVisible(false)
      fetchMediationCase()
    } catch (error) {
      message.error('记录保存失败')
    }
  }

  // 生成文书
  const handleGenerateDocument = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    documentForm.setFieldsValue({
      templateId: template.id,
      title: template.name
    })
    setIsDocumentModalVisible(true)
  }

  // 保存文书
  const handleSaveDocument = async () => {
    if (!state.mediationCase || !selectedTemplate) return
    
    try {
      const values = await documentForm.validateFields()
      const response = await mediationService.generateDocument(state.mediationCase.id, {
        templateId: selectedTemplate.id,
        ...values
      })
      
      message.success('文书生成成功')
      setIsDocumentModalVisible(false)
      
      // 下载生成的文书
      if (response.data.downloadUrl) {
        window.open(response.data.downloadUrl)
      }
    } catch (error) {
      message.error('文书生成失败')
    }
  }

  // 完成调解
  const handleCompleteMediation = (success: boolean) => {
    Modal.confirm({
      title: success ? '确认调解成功' : '确认调解失败',
      content: success ? '请确认调解已成功完成，相关文书已签署' : '请确认调解已失败，将转入诉讼程序',
      onOk: async () => {
        if (!state.mediationCase) return
        
        try {
          await mediationService.completeMediation(state.mediationCase.id, {
            status: success ? MediationStatus.SUCCESS : MediationStatus.FAILED,
            result: success ? '调解成功' : '调解失败',
            completedTime: new Date().toISOString()
          })
          
          message.success(success ? '调解成功完成' : '调解失败处理完成')
          navigate('/mediation/list')
        } catch (error) {
          message.error('操作失败')
        }
      }
    })
  }

  useEffect(() => {
    fetchMediationCase()
    fetchDocumentTemplates()
  }, [id])

  if (!state.mediationCase) {
    return <div>加载中...</div>
  }

  return (
    <div>
      {/* 基本信息 */}
      <Card title="调解案件信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered>
          <Descriptions.Item label="案件编号">{state.mediationCase.caseNumber}</Descriptions.Item>
          <Descriptions.Item label="借款人">{state.mediationCase.borrowerName}</Descriptions.Item>
          <Descriptions.Item label="债务金额">{formatCurrency(state.mediationCase.debtAmount)}</Descriptions.Item>
          <Descriptions.Item label="调解员">{state.mediationCase.mediatorName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{state.mediationCase.phone}</Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={state.mediationCase.status === MediationStatus.SUCCESS ? 'green' : 
                       state.mediationCase.status === MediationStatus.FAILED ? 'red' : 'blue'}>
              {state.mediationCase.status === MediationStatus.PENDING ? '待开始' :
               state.mediationCase.status === MediationStatus.IN_PROGRESS ? '进行中' :
               state.mediationCase.status === MediationStatus.SUCCESS ? '调解成功' :
               state.mediationCase.status === MediationStatus.FAILED ? '调解失败' : '已暂停'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 调解步骤 */}
      <Card title="调解流程" style={{ marginBottom: 16 }}>
        <Steps
          current={state.currentStep}
          status={state.mediationCase.status === MediationStatus.FAILED ? 'error' : 
                  state.mediationCase.status === MediationStatus.SUCCESS ? 'finish' : 'process'}
          onChange={handleStepChange}
          items={mediationSteps}
        />
        
        <div style={{ marginTop: 16 }}>
          <Progress 
            percent={(state.currentStep + 1) * 20} 
            strokeColor={state.mediationCase.status === MediationStatus.FAILED ? '#ff4d4f' : '#1890ff'}
          />
        </div>
      </Card>

      {/* 调解信息编辑 */}
      <Card 
        title="调解信息" 
        extra={
          <Space>
            <Button icon={<SaveOutlined />} onClick={handleSave}>
              保存
            </Button>
            <Button type="primary" icon={<SendOutlined />} onClick={handleAddRecord}>
              添加记录
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="mediationMethod" label="调解方式">
                <Select placeholder="请选择调解方式">
                  <Option value="face_to_face">面对面调解</Option>
                  <Option value="phone">电话调解</Option>
                  <Option value="video">视频调解</Option>
                  <Option value="online">在线调解</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mediationLocation" label="调解地点">
                <Input placeholder="请输入调解地点" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="appointmentTime" label="预约时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedDuration" label="预计时长（分钟）">
                <Input type="number" placeholder="请输入预计时长" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="mediationPlan" label="调解方案">
            <TextArea
              placeholder="请输入调解方案和策略"
              rows={4}
              maxLength={1000}
              showCount
            />
          </Form.Item>
          
          <Form.Item name="remarks" label="备注">
            <TextArea
              placeholder="请输入备注信息"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Card>

      {/* 文书管理 */}
      <Card 
        title="文书管理" 
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          {state.documents.map(template => (
            <Col key={template.id} span={6} style={{ marginBottom: 16 }}>
              <Card
                size="small"
                title={template.name}
                extra={
                  <Button 
                    type="link" 
                    size="small"
                    icon={<FileTextOutlined />}
                    onClick={() => handleGenerateDocument(template)}
                  >
                    生成
                  </Button>
                }
              >
                <p style={{ fontSize: '12px', color: '#666' }}>{template.description}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <Space size="large">
          <Button 
            type="primary" 
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={() => handleCompleteMediation(true)}
            disabled={state.mediationCase.status !== MediationStatus.IN_PROGRESS}
          >
            调解成功
          </Button>
          <Button 
            danger
            size="large"
            icon={<CloseCircleOutlined />}
            onClick={() => handleCompleteMediation(false)}
            disabled={state.mediationCase.status !== MediationStatus.IN_PROGRESS}
          >
            调解失败
          </Button>
          <Button size="large" onClick={() => navigate('/mediation/list')}>
            返回列表
          </Button>
        </Space>
      </Card>

      {/* 添加调解记录弹窗 */}
      <Modal
        title="添加调解记录"
        open={isRecordModalVisible}
        onOk={handleSaveRecord}
        onCancel={() => setIsRecordModalVisible(false)}
        width={600}
      >
        <Form
          form={recordForm}
          layout="vertical"
        >
          <Form.Item
            name="type"
            label="记录类型"
            rules={[{ required: true, message: '请选择记录类型' }]}
          >
            <Select placeholder="请选择记录类型">
              <Option value="call">电话沟通</Option>
              <Option value="meeting">面谈会议</Option>
              <Option value="agreement">协议达成</Option>
              <Option value="document">文书签署</Option>
              <Option value="payment">付款记录</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="title"
            label="记录标题"
            rules={[{ required: true, message: '请输入记录标题' }]}
          >
            <Input placeholder="请输入记录标题" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="记录内容"
            rules={[{ required: true, message: '请输入记录内容' }]}
          >
            <TextArea
              placeholder="请详细描述调解过程和结果"
              rows={6}
              maxLength={2000}
              showCount
            />
          </Form.Item>
          
          <Form.Item name="contactTime" label="联系时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="attachments" label="附件上传">
            <Upload
              action="/api/mediation/upload"
              listType="text"
              maxCount={5}
            >
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 生成文书弹窗 */}
      <Modal
        title={`生成${selectedTemplate?.name || ''}`}
        open={isDocumentModalVisible}
        onOk={handleSaveDocument}
        onCancel={() => setIsDocumentModalVisible(false)}
        width={600}
      >
        <Form
          form={documentForm}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="文书标题"
            rules={[{ required: true, message: '请输入文书标题' }]}
          >
            <Input placeholder="请输入文书标题" />
          </Form.Item>
          
          <Form.Item name="agreementAmount" label="协议金额">
            <Input type="number" placeholder="请输入协议金额" addonAfter="元" />
          </Form.Item>
          
          <Form.Item name="paymentMethod" label="还款方式">
            <Select placeholder="请选择还款方式">
              <Option value="lump_sum">一次性还清</Option>
              <Option value="installment">分期还款</Option>
              <Option value="deferred">延期还款</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="paymentSchedule" label="还款计划">
            <TextArea
              placeholder="请输入详细的还款计划"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>
          
          <Form.Item name="additionalTerms" label="其他条款">
            <TextArea
              placeholder="请输入其他重要条款"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MediationProcess