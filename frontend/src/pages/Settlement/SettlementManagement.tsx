import React, { useState } from 'react'
import { Card, Tabs, Button, Space } from 'antd'
import {
  UnorderedListOutlined,
  CalculatorOutlined,
  BarChartOutlined,
  PlusOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

import SettlementList from './SettlementList'
import SettlementCalculator from './SettlementCalculator'
import SettlementReports from './SettlementReports'

const { TabPane } = Tabs

const SettlementManagement: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('list')

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  const tabExtra = (
    <Space>
      <Button 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={() => navigate('/settlement/create')}
      >
        新增结算
      </Button>
      <Button 
        icon={<CalculatorOutlined />}
        onClick={() => setActiveTab('calculator')}
      >
        费用计算
      </Button>
      <Button 
        icon={<BarChartOutlined />}
        onClick={() => setActiveTab('reports')}
      >
        报表分析
      </Button>
      <Button 
        icon={<SettingOutlined />}
        onClick={() => navigate('/settlement/settings')}
      >
        设置
      </Button>
    </Space>
  )

  return (
    <div>
      <Card 
        title="结算管理" 
        extra={tabExtra}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          style={{ padding: '0 24px' }}
        >
          <TabPane
            tab={
              <span>
                <UnorderedListOutlined />
                结算列表
              </span>
            }
            key="list"
          >
            <SettlementList />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <CalculatorOutlined />
                费用计算
              </span>
            }
            key="calculator"
          >
            <SettlementCalculator />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                报表分析
              </span>
            }
            key="reports"
          >
            <SettlementReports />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default SettlementManagement