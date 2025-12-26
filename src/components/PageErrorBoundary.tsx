import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ArrowLeft, Copy, ChevronDown, ChevronUp, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

class PageErrorBoundaryClass extends Component<Props & { navigate: (path: string) => void }, State> {
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
    console.error(`PageErrorBoundary [${this.props.pageName || 'Unknown'}] caught an error:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoBack = () => {
    this.props.navigate('/dashboard');
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  private getErrorDetails = (): string => {
    const { error, errorInfo } = this.state;
    const details = [];
    
    details.push(`Page: ${this.props.pageName || 'Unknown'}`);
    details.push(`Error: ${error?.message || 'Unknown error'}`);
    details.push(`Timestamp: ${new Date().toISOString()}`);
    details.push(`URL: ${window.location.href}`);
    
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

  public render() {
    if (this.state.hasError) {
      const { error, showDetails, copied } = this.state;

      return (
        <div className="flex items-center justify-center p-4 min-h-[400px]">
          <Card className="w-full max-w-lg border-destructive/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-lg">Error in {this.props.pageName || 'this page'}</CardTitle>
              <CardDescription className="text-sm">
                Something went wrong while loading this section.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Error Summary */}
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <Bug className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive break-words">
                    {error?.message || 'An unexpected error occurred'}
                  </p>
                </div>
              </div>

              {/* Expandable Details */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between p-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <span>Technical Details</span>
                  {showDetails ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                
                {showDetails && (
                  <div className="border-t">
                    <div className="p-2 bg-muted/30 max-h-32 overflow-auto">
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                        {this.getErrorDetails()}
                      </pre>
                    </div>
                    <div className="p-1.5 border-t bg-muted/10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={this.copyErrorDetails}
                        className="w-full gap-1.5 h-7 text-xs"
                      >
                        <Copy className="h-3 w-3" />
                        {copied ? 'Copied!' : 'Copy Error Details'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <Button onClick={this.handleRetry} size="sm" className="flex-1 gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoBack} variant="outline" size="sm" className="flex-1 gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper to inject navigate hook
export function PageErrorBoundary({ children, pageName }: Props) {
  const navigate = useNavigate();
  return (
    <PageErrorBoundaryClass navigate={navigate} pageName={pageName}>
      {children}
    </PageErrorBoundaryClass>
  );
}

export default PageErrorBoundary;
