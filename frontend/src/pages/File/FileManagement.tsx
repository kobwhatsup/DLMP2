import React, { useState } from 'react'
import { Card, Tabs, Button, Space } from 'antd'
import {
  FolderOutlined,
  UploadOutlined,
  ShareAltOutlined,
  BarChartOutlined,
  DeleteOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

import FileList from './FileList'
import FileUpload from './FileUpload'
import FileShare from './FileShare'
import FileStats from './FileStats'
import FileTrash from './FileTrash'

const { TabPane } = Tabs

const FileManagement: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('files')

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  const tabExtra = (
    <Space>
      <Button 
        type="primary" 
        icon={<UploadOutlined />}
        onClick={() => setActiveTab('upload')}
      >
        上传文件
      </Button>
      <Button 
        icon={<ShareAltOutlined />}
        onClick={() => setActiveTab('share')}
      >
        文件分享
      </Button>
      <Button 
        icon={<BarChartOutlined />}
        onClick={() => setActiveTab('stats')}
      >
        存储统计
      </Button>
      <Button 
        icon={<SettingOutlined />}
        onClick={() => navigate('/file/settings')}
      >
        设置
      </Button>
    </Space>
  )

  return (
    <div>
      <Card 
        title="文件管理中心" 
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
                <FolderOutlined />
                文件列表
              </span>
            }
            key="files"
          >
            <FileList />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <UploadOutlined />
                文件上传
              </span>
            }
            key="upload"
          >
            <FileUpload />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <ShareAltOutlined />
                文件分享
              </span>
            }
            key="share"
          >
            <FileShare />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                存储统计
              </span>
            }
            key="stats"
          >
            <FileStats />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <DeleteOutlined />
                回收站
              </span>
            }
            key="trash"
          >
            <FileTrash />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default FileManagement