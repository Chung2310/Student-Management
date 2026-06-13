import React, {StrictMode, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './hooks/useAuth.tsx';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
    
    // Gửi lỗi lên server
    fetch("/api/v1/log-client-error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: error.stack || error.toString(),
        info: errorInfo,
      }),
    }).catch(err => console.error("Failed to log error to server:", err));
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#0f172a", color: "#f87171", fontFamily: "monospace", minHeight: "100vh", display: "flex", flexDirection: "column", justifycontent: "center", alignItems: "center", textAlign: "center" }}>
          <div style={{ maxWidth: "600px", padding: "30px", background: "#1e293b", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)", border: "1px solid #334155" }}>
            <h2 style={{ color: "#ef4444", marginBottom: "16px" }}>Hệ thống gặp sự cố (Frontend Crash)</h2>
            <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>Ứng dụng React bị crash ở client-side. Chi tiết lỗi đã được gửi về máy chủ để phân tích.</p>
            <pre style={{ background: "#0f172a", color: "#f87171", padding: "12px", borderRadius: "8px", overflow: "auto", textAlign: "left", fontSize: "12px", maxHeight: "200px" }}>
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              style={{ marginTop: "20px", padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this as any).props.children;
  }
}

// Bắt lỗi toàn cục ngoài React
window.addEventListener("error", (event) => {
  fetch("/api/v1/log-client-error", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: event.error?.stack || event.message,
      info: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    }),
  }).catch(err => console.error(err));
});

window.addEventListener("unhandledrejection", (event) => {
  fetch("/api/v1/log-client-error", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: event.reason?.stack || String(event.reason),
      info: "Unhandled Promise Rejection",
    }),
  }).catch(err => console.error(err));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
