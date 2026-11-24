import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

type ErrorBoundaryState = { hasError: boolean }

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('대시보드를 렌더링하지 못했습니다.', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" style={{ maxWidth: 640, margin: '10vh auto', padding: 24, fontFamily: 'sans-serif' }}>
          <h1>화면을 표시하지 못했습니다.</h1>
          <p>페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.</p>
        </main>
      )
    }

    return this.props.children
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('앱을 렌더링할 #root 요소를 찾을 수 없습니다.')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
