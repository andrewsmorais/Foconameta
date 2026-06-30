import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', paddingTop: 'env(safe-area-inset-top, 40px)', background: '#121212', minHeight: '100vh', color: '#fff', overflow: 'auto' }}>
          <h1 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '16px' }}>Ocorreu um erro fatal</h1>
          <p style={{ marginBottom: '16px' }}>Por favor, tire um print desta tela e envie para o suporte.</p>
          
          <div style={{ background: '#000', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            <strong>Erro:</strong> {this.state.error?.toString()}
          </div>
          
          {this.state.errorInfo && (
            <div style={{ background: '#000', padding: '10px', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
              {this.state.errorInfo.componentStack}
            </div>
          )}

          <Button onClick={() => window.location.reload()} variant="outline" className="w-full text-black bg-white">
            Tentar Novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
