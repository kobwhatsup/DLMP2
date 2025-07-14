import { useState, useEffect } from 'react'
import { Table, Button, Modal, message, Space, Tag } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined, BranchesOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { PageHeader, SearchForm, StatusTag } from '@/components'
import { caseService } from '@/services'
import { useCaseStore } from '@/stores'
import type { Case, FormField } from '@/types'

const CaseManagement: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { caseList, pagination, setCaseList, setSelectedCase } = useCaseStore()

  // 搜索表单字段配置
  const searchFields: FormField[] = [
    {
      name: 'caseNo',
      label: '案件编号',
      type: 'input',
    },
    {
      name: 'debtorName',
      label: '债务人姓名',
      type: 'input',
    },
    {
      name: 'debtorIdCard',
      label: '身份证号',
      type: 'input',
    },
    {
      name: 'caseStatus',
      label: '案件状态',
      type: 'select',
      options: [
        { label: '待分案', value: 1 },
        { label: '调解中', value: 2 },
        { label: '调解成功', value: 3 },
        { label: '调解失败', value: 4 },
        { label: '诉讼中', value: 5 },
        { label: '已结案', value: 6 },
      ],
    },
    {
      name: 'assignmentStatus',
      label: '分案状态',
      type: 'select',
      options: [
        { label: '未分案', value: 0 },
        { label: '已分案', value: 1 },
      ],
    },
  ]

  // 表格列配置
  const columns = [
    {
      title: '案件编号',
      dataIndex: 'caseNo',
      key: 'caseNo',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: '债务人姓名',
      dataIndex: 'debtorName',
      key: 'debtorName',
      width: 120,
    },
    {
      title: '身份证号',
      dataIndex: 'debtorIdCard',
      key: 'debtorIdCard',
      width: 160,
      render: (idCard: string) => 
        idCard ? `${idCard.slice(0, 6)}****${idCard.slice(-4)}` : '-',
    },
    {
      title: '手机号',
      dataIndex: 'debtorPhone',
      key: 'debtorPhone',
      width: 120,
      render: (phone: string) => 
        phone ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : '-',
    },
    {
      title: '逾期总金额',
      dataIndex: 'overdueTotalAmount',
      key: 'overdueTotalAmount',
      width: 120,
      render: (amount: number) => 
        amount ? `¥${amount.toLocaleString()}` : '-',
    },
    {
      title: '案件状态',
      dataIndex: 'caseStatus',
      key: 'caseStatus',
      width: 100,
      render: (status: number) => <StatusTag type='case' status={status} />,
    },
    {
      title: '分案状态',
      dataIndex: 'assignmentStatus',
      key: 'assignmentStatus',
      width: 100,
      render: (status: number) => <StatusTag type='assignment' status={status} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 150,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Case) => (
        <Space>
          <Button
            type='link'
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type='link'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.assignmentStatus === 0 && (
            <Button
              type='link'
              icon={<BranchesOutlined />}
              onClick={() => handleAssign(record)}
            >
              分案
            </Button>
          )}
          <Button
            type='link'
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // 加载案件数据
  const loadCases = async (params?: any) => {
    try {
      setLoading(true)
      const response = await caseService.getCases({
        page: pagination.current,
        size: pagination.pageSize,
        ...params,
      })
      
      if (response) {
        setCaseList(response)
      } else {
        // 如果没有数据，使用空数据结构
        setCaseList({
          records: [],
          total: 0,
          size: pagination.pageSize,
          current: pagination.current,
          pages: 0
        })
      }
    } catch (error) {
      console.error('加载案件数据失败:', error)
      message.error('加载案件数据失败，请检查网络连接')
      // 设置空数据避免页面崩溃
      setCaseList({
        records: [],
        total: 0,
        size: pagination.pageSize,
        current: pagination.current,
        pages: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadCases()
  }, [])

  // 搜索处理
  const handleSearch = (values: any) => {
    loadCases(values)
  }

  // 重置搜索
  const handleReset = () => {
    loadCases()
  }

  // 刷新数据
  const handleRefresh = () => {
    loadCases()
  }

  // 新增案件
  const handleAdd = () => {
    navigate('/case/import')
  }

  // 查看案件详情
  const handleView = (record: Case) => {
    setSelectedCase(record)
    navigate(`/case/detail/${record.id}`)
  }

  // 编辑案件
  const handleEdit = (record: Case) => {
    message.info(`编辑案件 ${record.caseNo} 功能开发中`)
  }

  // 分案
  const handleAssign = (record: Case) => {
    message.info(`分案功能开发中`)
  }

  // 删除案件
  const handleDelete = (record: Case) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除案件 ${record.caseNo} 吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await caseService.deleteCase(record.id)
          message.success('删除成功')
          handleRefresh()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 表格分页处理
  const handleTableChange = (paginationParams: any) => {
    loadCases()
  }

  return (
    <div>
      <PageHeader
        title='案件管理'
        subtitle='管理系统中的所有案件信息'
        onAdd={handleAdd}
        onRefresh={handleRefresh}
        addText='导入案件'
        showAdd
        showRefresh
      />

      <SearchForm
        fields={searchFields}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={loading}
      />

      <Table
        columns={columns}
        dataSource={caseList}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        rowKey='id'
        onChange={handleTableChange}
        scroll={{ x: 1400 }}
      />
    </div>
  )
}

export default CaseManagement