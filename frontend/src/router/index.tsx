import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'

import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'

// 懒加载组件
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const UserManagement = lazy(() => import('@/pages/User/UserManagement'))
const CaseManagement = lazy(() => import('@/pages/Case/CaseManagement'))
const CaseDetail = lazy(() => import('@/pages/Case/CaseDetail'))
const CaseImport = lazy(() => import('@/pages/Case/CaseImport'))
const AssignmentManagement = lazy(() => import('@/pages/Assignment/AssignmentManagement'))
const MediationManagement = lazy(() => import('@/pages/Mediation/MediationManagement'))
const LitigationManagement = lazy(() => import('@/pages/Litigation/LitigationManagement'))
const SettlementManagement = lazy(() => import('@/pages/Settlement/SettlementManagement'))
const NotificationCenter = lazy(() => import('@/pages/Notification/NotificationCenter'))
const FileManagement = lazy(() => import('@/pages/File/FileManagement'))
const SystemSettings = lazy(() => import('@/pages/System/SystemSettings'))

// 加载中组件
const PageSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense
    fallback={
      <div className='flex-center' style={{ height: '200px' }}>
        <Spin size='large' />
      </div>
    }
  >
    {children}
  </Suspense>
)

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to='/dashboard' replace />,
      },
      {
        path: 'dashboard',
        element: (
          <PageSuspense>
            <Dashboard />
          </PageSuspense>
        ),
      },
      {
        path: 'user',
        children: [
          {
            path: 'management',
            element: (
              <PageSuspense>
                <UserManagement />
              </PageSuspense>
            ),
          },
        ],
      },
      {
        path: 'case',
        children: [
          {
            path: 'management',
            element: (
              <PageSuspense>
                <CaseManagement />
              </PageSuspense>
            ),
          },
          {
            path: 'detail/:id',
            element: (
              <PageSuspense>
                <CaseDetail />
              </PageSuspense>
            ),
          },
          {
            path: 'import',
            element: (
              <PageSuspense>
                <CaseImport />
              </PageSuspense>
            ),
          },
        ],
      },
      {
        path: 'assignment',
        children: [
          {
            path: 'management',
            element: (
              <PageSuspense>
                <AssignmentManagement />
              </PageSuspense>
            ),
          },
        ],
      },
      {
        path: 'mediation',
        children: [
          {
            path: 'management',
            element: (
              <PageSuspense>
                <MediationManagement />
              </PageSuspense>
            ),
          },
        ],
      },
      {
        path: 'litigation',
        children: [
          {
            path: 'management',
            element: (
              <PageSuspense>
                <LitigationManagement />
              </PageSuspense>
            ),
          },
        ],
      },
      {
        path: 'settlement',
        children: [
          {
            path: 'management',
            element: (
              <PageSuspense>
                <SettlementManagement />
              </PageSuspense>
            ),
          },
        ],
      },
      {
        path: 'notification',
        children: [
          {
            path: 'center',
            element: (
              <PageSuspense>
                <NotificationCenter />
              </PageSuspense>
            ),
          },
        ],
      },
      {
        path: 'file',
        children: [
          {
            path: 'management',
            element: (
              <PageSuspense>
                <FileManagement />
              </PageSuspense>
            ),
          },
        ],
      },
      {
        path: 'system',
        children: [
          {
            path: 'settings',
            element: (
              <PageSuspense>
                <SystemSettings />
              </PageSuspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

export default router