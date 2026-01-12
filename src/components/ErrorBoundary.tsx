import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary
 * Catches React rendering errors and provides recovery UI
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="glass-card rounded-2xl p-8 max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <h2 className="font-display text-xl font-bold mb-2 text-foreground">
              Oops! Something went wrong
            </h2>
            
            <p className="text-muted-foreground text-sm mb-4">
              Don't worry! Miku encountered a small glitch. Let's try again! ✨
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-left overflow-auto max-h-32">
                <code className="text-xs text-destructive">
                  {this.state.error.message}
                </code>
              </div>
            )}
            
            <Button onClick={this.handleRetry} variant="miku" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * WebGL-specific Error Boundary
 * Handles Three.js / WebGL context loss
 */
interface WebGLErrorBoundaryState extends State {
  webglContextLost: boolean;
}

export class WebGLErrorBoundary extends Component<Props, WebGLErrorBoundaryState> {
  public state: WebGLErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    webglContextLost: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<WebGLErrorBoundaryState> {
    const isWebGLError = error.message.toLowerCase().includes('webgl') ||
                         error.message.toLowerCase().includes('context');
    return { 
      hasError: true, 
      error,
      webglContextLost: isWebGLError,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[WebGLErrorBoundary] Caught error:', error);
    this.setState({ errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      webglContextLost: false,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-miku-cyan/20 flex items-center justify-center">
              <span className="text-2xl">🎭</span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {this.state.webglContextLost 
                ? "3D graphics temporarily unavailable"
                : "Character loading failed"}
            </p>
            
            <Button onClick={this.handleRetry} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
