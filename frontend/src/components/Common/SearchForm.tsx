import { useState } from 'react'
import { Form, Input, Select, DatePicker, Button, Row, Col, Space } from 'antd'
import { SearchOutlined, ReloadOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import type { FormField } from '@/types'

const { RangePicker } = DatePicker

interface SearchFormProps {
  fields: FormField[]
  onSearch: (values: any) => void
  onReset?: () => void
  loading?: boolean
  expandable?: boolean
  defaultExpanded?: boolean
}

const SearchForm: React.FC<SearchFormProps> = ({
  fields,
  onSearch,
  onReset,
  loading = false,
  expandable = true,
  defaultExpanded = false,
}) => {
  const [form] = Form.useForm()
  const [expanded, setExpanded] = useState(defaultExpanded)

  // 处理搜索
  const handleSearch = () => {
    form.validateFields().then((values) => {
      onSearch(values)
    })
  }

  // 处理重置
  const handleReset = () => {
    form.resetFields()
    onReset?.()
  }

  // 渲染表单项
  const renderFormItem = (field: FormField) => {
    const { name, label, type, options, placeholder, rules = [] } = field

    switch (type) {
      case 'input':
        return (
          <Input
            placeholder={placeholder || `请输入${label}`}
            allowClear
          />
        )
      case 'select':
        return (
          <Select
            placeholder={placeholder || `请选择${label}`}
            allowClear
            options={options}
          />
        )
      case 'date':
        return (
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            style={{ width: '100%' }}
          />
        )
      case 'textarea':
        return (
          <Input.TextArea
            placeholder={placeholder || `请输入${label}`}
            allowClear
            rows={2}
          />
        )
      case 'number':
        return (
          <Input
            type='number'
            placeholder={placeholder || `请输入${label}`}
            allowClear
          />
        )
      default:
        return <Input placeholder={placeholder || `请输入${label}`} allowClear />
    }
  }

  // 计算显示的字段
  const visibleFields = expandable ? 
    (expanded ? fields : fields.slice(0, 3)) : 
    fields

  return (
    <div
      style={{
        padding: 24,
        background: '#fff',
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSearch}
      >
        <Row gutter={[16, 16]}>
          {visibleFields.map((field) => (
            <Col key={field.name} xs={24} sm={12} md={8} lg={6}>
              <Form.Item
                name={field.name}
                label={field.label}
                rules={field.rules}
              >
                {renderFormItem(field)}
              </Form.Item>
            </Col>
          ))}
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label=' '>
              <Space>
                <Button
                  type='primary'
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  loading={loading}
                >
                  搜索
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
                {expandable && fields.length > 3 && (
                  <Button
                    type='link'
                    onClick={() => setExpanded(!expanded)}
                    icon={expanded ? <UpOutlined /> : <DownOutlined />}
                  >
                    {expanded ? '收起' : '展开'}
                  </Button>
                )}
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export default SearchForm