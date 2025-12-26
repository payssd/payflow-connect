import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Copy, ChevronDown, ChevronUp, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  private getErrorDetails = (): string => {
    const { error, errorInfo } = this.state;
    const details = [];
    
    details.push(`Error: ${error?.message || 'Unknown error'}`);
    details.push(`Timestamp: ${new Date().toISOString()}`);
    details.push(`URL: ${window.location.href}`);
    details.push(`User Agent: ${navigator.userAgent}`);
    
    if (error?.stack) {
      details.push(`\nStack Trace:\n${error.stack}`);
    }
    
    if (errorInfo?.componentStack) {
      details.push(`\nComponent Stack:${errorInfo.componentStack}`);
    }
    
    return details.join('\n');
  };

  private copyErrorDetails = async () => {
    const details = this.getErrorDetails();
    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  private parseErrorLocation = (): { file: string; line: string; component: string } | null => {
    const { error, errorInfo } = this.state;
    
    // Try to extract file and line from stack trace
    if (error?.stack) {
      const match = error.stack.match(/at\s+(\w+)?\s*\(?([^:]+):(\d+):(\d+)\)?/);
      if (match) {
        return {
          component: match[1] || 'Unknown',
          file: match[2]?.split('/').pop() || 'Unknown file',
          line: match[3] || '?',
        };
      }
    }

    // Try to get component from componentStack
    if (errorInfo?.componentStack) {
      const componentMatch = errorInfo.componentStack.match(/at (\w+)/);
      if (componentMatch) {
        return {
          component: componentMatch[1],
          file: 'Unknown',
          line: '?',
        };
      }
    }

    return null;
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, showDetails, copied } = this.state;
      const location = this.parseErrorLocation();

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-0 shadow-card">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                We're sorry, but something unexpected happened. The error details below can help fix this issue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Summary Card */}
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-start gap-3">
                  <Bug className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-destructive text-sm break-words">
                      {error?.message || 'An unexpected error occurred'}
                    </p>
                    {location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        in <span className="font-mono">{location.component}</span>
                        {location.file !== 'Unknown' && (
                          <> ({location.file}:{location.line})</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Details */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between p-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <span>Technical Details</span>
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                
                {showDetails && (
                  <div className="border-t">
                    <div className="p-3 bg-muted/30 max-h-48 overflow-auto">
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                        {this.getErrorDetails()}
                      </pre>
                    </div>
                    <div className="p-2 border-t bg-muted/10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={this.copyErrorDetails}
                        className="w-full gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        {copied ? 'Copied!' : 'Copy Error Details'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button onClick={this.handleReload} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1 gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-center text-muted-foreground">
                If this problem persists, please copy the error details and contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
