import React, { useState } from 'react'
import { Tabs, Card } from 'antd'
import {
  SettingOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  MonitorOutlined,
  HistoryOutlined,
  FileProtectOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import SystemConfig from './components/SystemConfig'
import SecuritySettings from './components/SecuritySettings'
import DataDictionary from './components/DataDictionary'
import SystemMonitor from './components/SystemMonitor'
import SystemLogs from './components/SystemLogs'
import DataBackup from './components/DataBackup'
import SystemInfo from './components/SystemInfo'

const { TabPane } = Tabs

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('config')

  const tabItems = [
    {
      key: 'config',
      label: (
        <span>
          <SettingOutlined />
          系统配置
        </span>
      ),
      children: <SystemConfig />
    },
    {
      key: 'security',
      label: (
        <span>
          <SecurityScanOutlined />
          安全设置
        </span>
      ),
      children: <SecuritySettings />
    },
    {
      key: 'dictionary',
      label: (
        <span>
          <DatabaseOutlined />
          数据字典
        </span>
      ),
      children: <DataDictionary />
    },
    {
      key: 'monitor',
      label: (
        <span>
          <MonitorOutlined />
          系统监控
        </span>
      ),
      children: <SystemMonitor />
    },
    {
      key: 'logs',
      label: (
        <span>
          <HistoryOutlined />
          系统日志
        </span>
      ),
      children: <SystemLogs />
    },
    {
      key: 'backup',
      label: (
        <span>
          <FileProtectOutlined />
          数据备份
        </span>
      ),
      children: <DataBackup />
    },
    {
      key: 'info',
      label: (
        <span>
          <InfoCircleOutlined />
          系统信息
        </span>
      ),
      children: <SystemInfo />
    }
  ]

  return (
    <div>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          tabPosition="top"
          destroyInactiveTabPane
        />
      </Card>
    </div>
  )
}

export default SystemSettings