import React from 'react'
import { Result, Button } from 'antd'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('错误边界捕获到错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="页面加载错误"
          subTitle={
            <div>
              <p>抱歉，页面加载时出现了错误。</p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details style={{ textAlign: 'left', marginTop: 16 }}>
                  <summary>错误详情（开发模式）</summary>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 4,
                    fontSize: 12,
                    overflow: 'auto'
                  }}>
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          }
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          }
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary