import React, { ErrorInfo, Component, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps & { showToast: (message: string) => void }, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps & { showToast: (message: string) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by error boundary:", error, errorInfo);
    
    // Handle rate limiting specifically
    if (error.message.startsWith("RATE_LIMIT:")) {
      this.props.showToast("Rate limit reached. Please wait a moment before trying again.");
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Check if this is a rate limiting error
      if (this.state.error?.message.startsWith("RATE_LIMIT:")) {
        return (
          <div className="flex items-center justify-center h-full p-8 text-center">
            <div className="max-w-md p-6 bg-card rounded-lg shadow-md">
              <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold mb-4">Rate Limit Reached</h2>
              <p className="mb-6 text-muted-foreground">
                Our application is experiencing high traffic. Please wait a moment before trying again.
              </p>
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        );
      }

      // Generic error
      return (
        <div className="flex items-center justify-center h-full p-8 text-center">
          <div className="max-w-md p-6 bg-card rounded-lg shadow-md">
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
            <p className="mb-6 text-muted-foreground">
              We're sorry, but something went wrong with the application.
            </p>
            <Button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: ErrorBoundaryProps): JSX.Element {
  const { toast } = useToast();
  
  const showToast = (message: string) => {
    toast({
      title: "Application Error",
      description: message,
      variant: "destructive"
    });
  };

  return (
    <ErrorBoundaryClass showToast={showToast}>
      {children}
    </ErrorBoundaryClass>
  );
}