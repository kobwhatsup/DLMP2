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
  Card,
  Row,
  Col,
  Tag,
  Popconfirm,
  Tooltip,
  Upload,
  Progress,
  DatePicker
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  EyeOutlined,
  UploadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd/es/upload'
import { Case, CaseStatus, UserType } from '@/types'
import { caseService } from '@/services'
import StatusTag from '@/components/Common/StatusTag'
import { formatDateTime, formatCurrency } from '@/utils'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { Search } = Input
const { RangePicker } = DatePicker

interface CaseListState {
  cases: Case[]
  loading: boolean
  total: number
  current: number
  pageSize: number
}

interface SearchParams {
  caseNumber?: string
  borrowerName?: string
  debtorIdCard?: string
  status?: CaseStatus
  createTimeRange?: string[]
  amountRange?: [number, number]
}

const CaseList: React.FC = () => {
  const navigate = useNavigate()
  const [listState, setListState] = useState<CaseListState>({
    cases: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10
  })
  
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isImportModalVisible, setIsImportModalVisible] = useState(false)
  const [editingCase, setEditingCase] = useState<Case | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [form] = Form.useForm()

  // 表格列定义
  const columns: ColumnsType<Case> = [
    {
      title: '案件编号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      width: 140,
      ellipsis: true,
      render: (text, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => navigate(`/case/detail/${record.id}`)}
        >
          {text}
        </Button>
      )
    },
    {
      title: '借款人姓名',
      dataIndex: 'borrowerName',
      key: 'borrowerName',
      width: 100,
      ellipsis: true
    },
    {
      title: '身份证号',
      dataIndex: 'debtorIdCard',
      key: 'debtorIdCard',
      width: 120,
      render: (idCard: string) => idCard ? `${idCard.slice(0, 6)}****${idCard.slice(-4)}` : '-'
    },
    {
      title: '债务金额',
      dataIndex: 'debtAmount',
      key: 'debtAmount',
      width: 120,
      render: (amount: number) => formatCurrency(amount),
      sorter: true
    },
    {
      title: '案件状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CaseStatus) => (
        <StatusTag type="case" status={status} />
      )
    },
    {
      title: '委托机构',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 150,
      ellipsis: true
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
      title: '分案时间',
      dataIndex: 'assignTime',
      key: 'assignTime',
      width: 160,
      render: (time: string) => time ? formatDateTime(time) : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/case/detail/${record.id}`)}
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
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除该案件吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ]

  // 获取案件列表
  const fetchCases = async () => {
    setListState(prev => ({ ...prev, loading: true }))
    try {
      const response = await caseService.getCaseList({
        ...searchParams,
        page: listState.current,
        size: listState.pageSize
      })
      
      setListState(prev => ({
        ...prev,
        cases: response.data.records,
        total: response.data.total,
        loading: false
      }))
    } catch (error) {
      message.error('获取案件列表失败')
      setListState(prev => ({ ...prev, loading: false }))
    }
  }

  // 搜索
  const handleSearch = (params: SearchParams) => {
    setSearchParams(params)
    setListState(prev => ({ ...prev, current: 1 }))
  }

  // 重置搜索
  const handleReset = () => {
    setSearchParams({})
    setListState(prev => ({ ...prev, current: 1 }))
  }

  // 新增案件
  const handleAdd = () => {
    setEditingCase(null)
    setIsModalVisible(true)
    form.resetFields()
  }

  // 编辑案件
  const handleEdit = (caseItem: Case) => {
    setEditingCase(caseItem)
    setIsModalVisible(true)
    form.setFieldsValue(caseItem)
  }

  // 删除案件
  const handleDelete = async (id: number) => {
    try {
      await caseService.deleteCase(id)
      message.success('删除成功')
      fetchCases()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 保存案件
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingCase) {
        await caseService.updateCase(editingCase.id, values)
        message.success('更新成功')
      } else {
        await caseService.createCase(values)
        message.success('创建成功')
      }
      
      setIsModalVisible(false)
      fetchCases()
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请检查表单填写')
      } else {
        message.error(editingCase ? '更新失败' : '创建失败')
      }
    }
  }

  // 导出数据
  const handleExport = async () => {
    try {
      const response = await caseService.exportCases(searchParams)
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `案件列表_${new Date().toISOString().slice(0, 10)}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 批量导入
  const handleImport = () => {
    setIsImportModalVisible(true)
    setUploadProgress(0)
  }

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/case/import',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    accept: '.xlsx,.xls',
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.type === 'application/vnd.ms-excel'
      if (!isExcel) {
        message.error('只能上传Excel文件！')
        return false
      }
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error('文件大小不能超过10MB！')
        return false
      }
      return true
    },
    onChange: (info) => {
      if (info.file.status === 'uploading') {
        setUploadProgress(info.file.percent || 0)
      }
      if (info.file.status === 'done') {
        message.success('导入成功')
        setIsImportModalVisible(false)
        fetchCases()
      } else if (info.file.status === 'error') {
        message.error('导入失败')
      }
    }
  }

  // 下载模板
  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/api/case/template'
    link.download = '案件导入模板.xlsx'
    link.click()
  }

  // 表格变化处理
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setListState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  useEffect(() => {
    fetchCases()
  }, [listState.current, listState.pageSize, searchParams])

  return (
    <div>
      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          layout="inline"
          onFinish={handleSearch}
          initialValues={searchParams}
        >
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="caseNumber" label="案件编号">
                <Input placeholder="请输入案件编号" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="borrowerName" label="借款人">
                <Input placeholder="请输入借款人姓名" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="debtorIdCard" label="身份证号">
                <Input placeholder="请输入身份证号" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item name="status" label="案件状态">
                <Select placeholder="请选择案件状态" allowClear>
                  <Option value={CaseStatus.PENDING_ASSIGNMENT}>待分案</Option>
                  <Option value={CaseStatus.ASSIGNED}>已分案</Option>
                  <Option value={CaseStatus.IN_MEDIATION}>调解中</Option>
                  <Option value={CaseStatus.MEDIATION_SUCCESS}>调解成功</Option>
                  <Option value={CaseStatus.MEDIATION_FAILED}>调解失败</Option>
                  <Option value={CaseStatus.IN_LITIGATION}>诉讼中</Option>
                  <Option value={CaseStatus.LITIGATION_SUCCESS}>诉讼成功</Option>
                  <Option value={CaseStatus.CLOSED}>已结案</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="createTimeRange" label="创建时间">
                <RangePicker placeholder={['开始时间', '结束时间']} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增案件
          </Button>
          <Button icon={<ImportOutlined />} onClick={handleImport}>
            批量导入
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出数据
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchCases}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 案件表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={listState.cases}
          rowKey="id"
          loading={listState.loading}
          pagination={{
            current: listState.current,
            pageSize: listState.pageSize,
            total: listState.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 新增/编辑案件弹窗 */}
      <Modal
        title={editingCase ? '编辑案件' : '新增案件'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="caseNumber"
                label="案件编号"
                rules={[{ required: true, message: '请输入案件编号' }]}
              >
                <Input placeholder="请输入案件编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="borrowerName"
                label="借款人姓名"
                rules={[{ required: true, message: '请输入借款人姓名' }]}
              >
                <Input placeholder="请输入借款人姓名" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="debtorIdCard"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号' }
                ]}
              >
                <Input placeholder="请输入身份证号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="debtAmount"
                label="债务金额"
                rules={[{ required: true, message: '请输入债务金额' }]}
              >
                <Input type="number" placeholder="请输入债务金额" addonAfter="元" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="clientName"
                label="委托机构"
                rules={[{ required: true, message: '请输入委托机构' }]}
              >
                <Input placeholder="请输入委托机构" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="address"
            label="联系地址"
          >
            <Input placeholder="请输入联系地址" />
          </Form.Item>
          
          <Form.Item
            name="caseDescription"
            label="案件描述"
          >
            <Input.TextArea
              placeholder="请输入案件描述"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量导入弹窗 */}
      <Modal
        title="批量导入案件"
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        footer={[
          <Button key="template" onClick={handleDownloadTemplate}>
            下载模板
          </Button>,
          <Button key="cancel" onClick={() => setIsImportModalVisible(false)}>
            取消
          </Button>
        ]}
        width={500}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} size="large">
              选择Excel文件
            </Button>
          </Upload>
          
          {uploadProgress > 0 && (
            <div style={{ marginTop: 16 }}>
              <Progress percent={uploadProgress} />
            </div>
          )}
          
          <div style={{ marginTop: 16, color: '#666', fontSize: '12px' }}>
            <p>支持.xlsx、.xls格式，文件大小不超过10MB</p>
            <p>请先下载模板，按模板格式填写数据后上传</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CaseList