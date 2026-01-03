"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={cn(
          "flex flex-col items-center justify-center p-6 rounded-xl bg-card border border-border text-center space-y-4",
          this.props.className
        )}>
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">出错了</h3>
            <p className="text-sm text-muted-foreground mt-1">
              加载此部分内容时遇到问题
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
               <p className="text-xs text-destructive bg-destructive/5 p-2 rounded mt-2 text-left font-mono break-all max-w-[300px] mx-auto">
                   {this.state.error.message}
               </p>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={this.resetErrorBoundary}
            className="border-border hover:bg-accent hover:text-accent-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
