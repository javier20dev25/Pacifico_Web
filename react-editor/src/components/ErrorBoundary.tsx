import React from 'react';

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:20}}>
          <h2>Ha ocurrido un error en la UI</h2>
          <pre style={{whiteSpace:'pre-wrap'}}>{this.state.error?.message || String(this.state.error)}</pre>
          <p>Puedes revisar la consola para más detalles.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
