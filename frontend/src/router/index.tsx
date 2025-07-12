import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'

import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'

// 懒加载组件
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const UserManagement = lazy(() => import('@/pages/User/UserManagement'))
const UserList = lazy(() => import('@/pages/User/UserList'))
const RoleList = lazy(() => import('@/pages/User/RoleList'))
const CaseManagement = lazy(() => import('@/pages/Case/CaseManagement'))
const CaseList = lazy(() => import('@/pages/Case/CaseList'))
const CaseDetail = lazy(() => import('@/pages/Case/CaseDetail'))
const CaseImport = lazy(() => import('@/pages/Case/CaseImport'))
const AssignmentManagement = lazy(() => import('@/pages/Assignment/AssignmentManagement'))
const AssignmentRules = lazy(() => import('@/pages/Assignment/AssignmentRules'))
const SmartAssignment = lazy(() => import('@/pages/Assignment/SmartAssignment'))
const MediationManagement = lazy(() => import('@/pages/Mediation/MediationManagement'))
const MediationList = lazy(() => import('@/pages/Mediation/MediationList'))
const MediationProcess = lazy(() => import('@/pages/Mediation/MediationProcess'))
const LitigationManagement = lazy(() => import('@/pages/Litigation/LitigationManagement'))
const LitigationList = lazy(() => import('@/pages/Litigation/LitigationList'))
const LitigationProcess = lazy(() => import('@/pages/Litigation/LitigationProcess'))
const SettlementManagement = lazy(() => import('@/pages/Settlement/SettlementManagement'))
const SettlementList = lazy(() => import('@/pages/Settlement/SettlementList'))
const SettlementCalculator = lazy(() => import('@/pages/Settlement/SettlementCalculator'))
const SettlementReports = lazy(() => import('@/pages/Settlement/SettlementReports'))
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
          {
            path: 'list',
            element: (
              <PageSuspense>
                <UserList />
              </PageSuspense>
            ),
          },
          {
            path: 'roles',
            element: (
              <PageSuspense>
                <RoleList />
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
            path: 'list',
            element: (
              <PageSuspense>
                <CaseList />
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
          {
            path: 'rules',
            element: (
              <PageSuspense>
                <AssignmentRules />
              </PageSuspense>
            ),
          },
          {
            path: 'smart',
            element: (
              <PageSuspense>
                <SmartAssignment />
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
          {
            path: 'list',
            element: (
              <PageSuspense>
                <MediationList />
              </PageSuspense>
            ),
          },
          {
            path: 'process/:id',
            element: (
              <PageSuspense>
                <MediationProcess />
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
          {
            path: 'list',
            element: (
              <PageSuspense>
                <LitigationList />
              </PageSuspense>
            ),
          },
          {
            path: 'process/:id',
            element: (
              <PageSuspense>
                <LitigationProcess />
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
          {
            path: 'list',
            element: (
              <PageSuspense>
                <SettlementList />
              </PageSuspense>
            ),
          },
          {
            path: 'calculator',
            element: (
              <PageSuspense>
                <SettlementCalculator />
              </PageSuspense>
            ),
          },
          {
            path: 'reports',
            element: (
              <PageSuspense>
                <SettlementReports />
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