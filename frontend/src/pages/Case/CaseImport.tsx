import { useState } from 'react'
import {
  Card,
  Upload,
  Button,
  Steps,
  Table,
  message,
  Alert,
  Progress,
  Space,
  Typography,
  Divider,
  Tag,
  Modal,
  Row,
  Col,
  Statistic,
  List,
  Tooltip
} from 'antd'
import {
  InboxOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { PageHeader } from '@/components'
import type { UploadProps, TableColumnsType } from 'antd'
import { caseService } from '@/services'

const { Dragger } = Upload
const { Step } = Steps
const { Title, Paragraph, Text } = Typography

interface ImportCase {
  id?: number
  row: number
  caseNo?: string
  debtorName: string
  debtorIdCard: string
  debtorPhone?: string
  amount: number
  overdueTotalAmount: number
  clientName: string
  status?: 'valid' | 'invalid' | 'duplicate'
  errors?: string[]
}

interface ImportResult {
  total: number
  success: number
  failed: number
  duplicate: number
  errors: Array<{ row: number; message: string }>
}

const CaseImport: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [fileList, setFileList] = useState<any[]>([])
  const [importData, setImportData] = useState<ImportCase[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)

  // 模拟Excel文件解析
  const parseExcelFile = (file: File): Promise<ImportCase[]> => {
    return new Promise((resolve) => {
      // 模拟解析过程
      setTimeout(() => {
        const mockData: ImportCase[] = [
          {
            row: 2,
            caseNo: 'DLMP20250713001',
            debtorName: '测试用户一',
            debtorIdCard: '110101199001010001',
            debtorPhone: '13800138001',
            amount: 50000,
            overdueTotalAmount: 52000,
            clientName: '测试银行',
            status: 'valid'
          },
          {
            row: 3,
            debtorName: '测试用户二',
            debtorIdCard: '110101199002020002',
            debtorPhone: '13800138002',
            amount: 80000,
            overdueTotalAmount: 85000,
            clientName: '测试银行',
            status: 'valid'
          },
          {
            row: 4,
            debtorName: '',
            debtorIdCard: '110101199003030003',
            debtorPhone: '13800138003',
            amount: 30000,
            overdueTotalAmount: 32000,
            clientName: '测试银行',
            status: 'invalid',
            errors: ['债务人姓名不能为空']
          },
          {
            row: 5,
            debtorName: '测试用户四',
            debtorIdCard: '110101199001010001', // 重复身份证
            debtorPhone: '13800138004',
            amount: 60000,
            overdueTotalAmount: 63000,
            clientName: '测试银行',
            status: 'duplicate',
            errors: ['身份证号码重复']
          }
        ]
        resolve(mockData)
      }, 1500)
    })
  }

  // 数据验证
  const validateData = (data: ImportCase[]): ImportCase[] => {
    const idCardSet = new Set()
    
    return data.map(item => {
      const errors: string[] = []
      
      // 必填字段验证
      if (!item.debtorName?.trim()) {
        errors.push('债务人姓名不能为空')
      }
      if (!item.debtorIdCard?.trim()) {
        errors.push('身份证号码不能为空')
      }
      if (!item.amount || item.amount <= 0) {
        errors.push('借款金额必须大于0')
      }
      if (!item.clientName?.trim()) {
        errors.push('委托方名称不能为空')
      }
      
      // 身份证格式验证
      if (item.debtorIdCard && !/^\d{17}[\dX]$/.test(item.debtorIdCard)) {
        errors.push('身份证号码格式不正确')
      }
      
      // 重复性检查
      if (item.debtorIdCard && idCardSet.has(item.debtorIdCard)) {
        errors.push('身份证号码重复')
        return { ...item, status: 'duplicate' as const, errors }
      } else if (item.debtorIdCard) {
        idCardSet.add(item.debtorIdCard)
      }
      
      return {
        ...item,
        status: errors.length > 0 ? 'invalid' as const : 'valid' as const,
        errors: errors.length > 0 ? errors : undefined
      }
    })
  }

  // 文件上传处理
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    
    try {
      setUploading(true)
      const parsedData = await parseExcelFile(file as File)
      const validatedData = validateData(parsedData)
      
      setImportData(validatedData)
      setCurrentStep(1)
      onSuccess?.(validatedData)
      message.success('文件解析成功！')
    } catch (error) {
      onError?.(error as Error)
      message.error('文件解析失败，请检查文件格式')
    } finally {
      setUploading(false)
    }
  }

  // 批量导入
  const handleImport = async () => {
    const validData = importData.filter(item => item.status === 'valid')
    
    if (validData.length === 0) {
      message.warning('没有有效的数据可以导入')
      return
    }

    try {
      setImporting(true)
      
      // 调用实际的批量导入API
      const response = await caseService.batchImportCases(validData)
      
      const result: ImportResult = {
        total: importData.length,
        success: response.success || validData.length,
        failed: importData.filter(item => item.status === 'invalid').length,
        duplicate: importData.filter(item => item.status === 'duplicate').length,
        errors: importData
          .filter(item => item.status !== 'valid')
          .map(item => ({
            row: item.row,
            message: item.errors?.join(', ') || '未知错误'
          }))
      }
      
      setImportResult(result)
      setCurrentStep(2)
      message.success(`导入完成！成功 ${result.success} 条，失败 ${result.failed + result.duplicate} 条`)
    } catch (error) {
      message.error('导入失败，请重试')
    } finally {
      setImporting(false)
    }
  }

  // 重新开始
  const handleReset = () => {
    setCurrentStep(0)
    setFileList([])
    setImportData([])
    setImportResult(null)
  }

  // 下载模板
  const handleDownloadTemplate = () => {
    // 创建模拟的Excel模板下载
    const templateData = `案件编号,债务人姓名,身份证号码,手机号码,借款金额,逾期总金额,委托方名称
DLMP20250713001,张三,110101199001010001,13800138001,50000,52000,某银行
,李四,110101199002020002,13800138002,80000,85000,某银行`
    
    const blob = new Blob([templateData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '案件导入模板.csv'
    link.click()
    
    message.success('模板下载成功')
  }

  // 表格列定义
  const columns: TableColumnsType<ImportCase> = [
    {
      title: '行号',
      dataIndex: 'row',
      width: 60,
      align: 'center'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      align: 'center',
      render: (status: string) => {
        const statusConfig = {
          valid: { color: 'green', icon: <CheckCircleOutlined />, text: '有效' },
          invalid: { color: 'red', icon: <CloseCircleOutlined />, text: '无效' },
          duplicate: { color: 'orange', icon: <ExclamationCircleOutlined />, text: '重复' }
        }
        const config = statusConfig[status as keyof typeof statusConfig]
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '案件编号',
      dataIndex: 'caseNo',
      width: 140
    },
    {
      title: '债务人姓名',
      dataIndex: 'debtorName',
      width: 100
    },
    {
      title: '身份证号码',
      dataIndex: 'debtorIdCard',
      width: 160,
      render: (idCard: string) => idCard ? `${idCard.slice(0, 6)}****${idCard.slice(-4)}` : '-'
    },
    {
      title: '手机号码',
      dataIndex: 'debtorPhone',
      width: 120,
      render: (phone: string) => phone ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : '-'
    },
    {
      title: '借款金额',
      dataIndex: 'amount',
      width: 100,
      align: 'right',
      render: (amount: number) => `¥${amount?.toLocaleString() || 0}`
    },
    {
      title: '逾期总金额',
      dataIndex: 'overdueTotalAmount',
      width: 120,
      align: 'right',
      render: (amount: number) => `¥${amount?.toLocaleString() || 0}`
    },
    {
      title: '委托方',
      dataIndex: 'clientName',
      width: 100
    },
    {
      title: '错误信息',
      dataIndex: 'errors',
      render: (errors: string[]) => {
        if (!errors || errors.length === 0) return '-'
        return (
          <Tooltip title={errors.join('; ')}>
            <Text type="danger" ellipsis style={{ maxWidth: 120 }}>
              {errors.join('; ')}
            </Text>
          </Tooltip>
        )
      }
    }
  ]

  const validCount = importData.filter(item => item.status === 'valid').length
  const invalidCount = importData.filter(item => item.status === 'invalid').length
  const duplicateCount = importData.filter(item => item.status === 'duplicate').length

  return (
    <div>
      <PageHeader
        title="案件导入"
        subtitle="批量导入案件信息，支持Excel文件上传和数据验证"
        onRefresh={handleReset}
        showRefresh
      />

      <Card>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step title="上传文件" description="选择Excel文件并解析数据" />
          <Step title="数据验证" description="检查数据完整性和有效性" />
          <Step title="导入完成" description="查看导入结果和错误信息" />
        </Steps>

        {/* 步骤1：文件上传 */}
        {currentStep === 0 && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={16}>
                <Card title="文件上传" size="small">
                  <Dragger
                    name="file"
                    multiple={false}
                    fileList={fileList}
                    customRequest={handleUpload}
                    onChange={({ fileList }) => setFileList(fileList)}
                    accept=".xlsx,.xls,.csv"
                    showUploadList={{
                      showRemoveIcon: true,
                      showPreviewIcon: false
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                    <p className="ant-upload-hint">
                      支持 .xlsx、.xls、.csv 格式文件，单次上传文件大小不超过 10MB
                    </p>
                  </Dragger>
                  
                  {uploading && (
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Progress percent={66} status="active" />
                      <p style={{ marginTop: 8 }}>正在解析文件...</p>
                    </div>
                  )}
                </Card>
              </Col>
              
              <Col span={8}>
                <Card title="导入说明" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />} 
                      onClick={handleDownloadTemplate}
                      block
                    >
                      下载导入模板
                    </Button>
                    
                    <Divider style={{ margin: '12px 0' }} />
                    
                    <div>
                      <Title level={5} style={{ margin: 0 }}>必填字段</Title>
                      <List size="small" style={{ marginTop: 8 }}>
                        <List.Item>• 债务人姓名</List.Item>
                        <List.Item>• 身份证号码</List.Item>
                        <List.Item>• 借款金额</List.Item>
                        <List.Item>• 委托方名称</List.Item>
                      </List>
                    </div>
                    
                    <Alert
                      message="注意事项"
                      description="请确保身份证号码格式正确且不重复，金额字段为数字格式"
                      type="info"
                      showIcon
                      size="small"
                    />
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* 步骤2：数据验证 */}
        {currentStep === 1 && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic title="总计" value={importData.length} />
              </Col>
              <Col span={6}>
                <Statistic title="有效" value={validCount} valueStyle={{ color: '#3f8600' }} />
              </Col>
              <Col span={6}>
                <Statistic title="无效" value={invalidCount} valueStyle={{ color: '#cf1322' }} />
              </Col>
              <Col span={6}>
                <Statistic title="重复" value={duplicateCount} valueStyle={{ color: '#fa8c16' }} />
              </Col>
            </Row>

            {(invalidCount > 0 || duplicateCount > 0) && (
              <Alert
                message={`发现 ${invalidCount + duplicateCount} 条问题数据`}
                description="请检查并修正标记为红色的数据行，或选择仅导入有效数据"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Card 
              title="数据预览" 
              size="small"
              extra={
                <Space>
                  <Button onClick={() => setPreviewVisible(true)} icon={<EyeOutlined />}>
                    查看详情
                  </Button>
                  <Button type="primary" onClick={handleImport} loading={importing} disabled={validCount === 0}>
                    {importing ? '导入中...' : `导入 ${validCount} 条有效数据`}
                  </Button>
                </Space>
              }
            >
              <Table
                dataSource={importData}
                columns={columns}
                rowKey="row"
                size="small"
                scroll={{ x: 1000, y: 400 }}
                pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
                rowClassName={(record) => {
                  if (record.status === 'invalid') return 'bg-red-50'
                  if (record.status === 'duplicate') return 'bg-orange-50'
                  return ''
                }}
              />
            </Card>
          </div>
        )}

        {/* 步骤3：导入完成 */}
        {currentStep === 2 && importResult && (
          <div>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
              <Title level={2}>导入完成</Title>
              <Paragraph>
                本次共处理 {importResult.total} 条数据，成功导入 {importResult.success} 条
              </Paragraph>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic title="总计" value={importResult.total} />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic title="成功" value={importResult.success} valueStyle={{ color: '#3f8600' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic title="失败" value={importResult.failed} valueStyle={{ color: '#cf1322' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic title="重复" value={importResult.duplicate} valueStyle={{ color: '#fa8c16' }} />
                </Card>
              </Col>
            </Row>

            {importResult.errors.length > 0 && (
              <Card title="错误详情" style={{ marginBottom: 16 }}>
                <List
                  dataSource={importResult.errors}
                  renderItem={(item) => (
                    <List.Item>
                      <Text>第 {item.row} 行：</Text>
                      <Text type="danger">{item.message}</Text>
                    </List.Item>
                  )}
                  pagination={{ pageSize: 5 }}
                />
              </Card>
            )}

            <div style={{ textAlign: 'center' }}>
              <Space>
                <Button type="primary" onClick={handleReset}>
                  继续导入
                </Button>
                <Button onClick={() => window.history.back()}>
                  返回案件管理
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Card>

      {/* 数据详情弹窗 */}
      <Modal
        title="数据详情"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={1200}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Table
          dataSource={importData}
          columns={columns}
          rowKey="row"
          size="small"
          scroll={{ x: 1000, y: 500 }}
          pagination={{ pageSize: 20 }}
        />
      </Modal>
    </div>
  )
}

export default CaseImport