import React, { useState } from 'react'
import { Card, Tabs, Button, Space } from 'antd'
import {
  InboxOutlined,
  BellOutlined,
  SettingOutlined,
  SendOutlined,
  FileTextOutlined,
  SoundOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

import NotificationList from './NotificationList'
import NotificationSettings from './NotificationSettings'
import NotificationTemplates from './NotificationTemplates'
import NotificationSend from './NotificationSend'

const { TabPane } = Tabs

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('inbox')

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  const tabExtra = (
    <Space>
      <Button 
        type="primary" 
        icon={<SendOutlined />}
        onClick={() => setActiveTab('send')}
      >
        发送通知
      </Button>
      <Button 
        icon={<FileTextOutlined />}
        onClick={() => setActiveTab('templates')}
      >
        模板管理
      </Button>
      <Button 
        icon={<SettingOutlined />}
        onClick={() => setActiveTab('settings')}
      >
        通知设置
      </Button>
    </Space>
  )

  return (
    <div>
      <Card 
        title="消息通知中心" 
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
                <InboxOutlined />
                消息列表
              </span>
            }
            key="inbox"
          >
            <NotificationList />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <SendOutlined />
                发送通知
              </span>
            }
            key="send"
          >
            <NotificationSend />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                模板管理
              </span>
            }
            key="templates"
          >
            <NotificationTemplates />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                通知设置
              </span>
            }
            key="settings"
          >
            <NotificationSettings />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default NotificationCenter