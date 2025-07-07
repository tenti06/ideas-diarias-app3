import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Check if it's a Firebase error and enable demo mode
    if (
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("Firebase") ||
      error.name === "TypeError"
    ) {
      console.log("Firebase error detected, enabling demo mode");
      // Dynamically import and enable demo mode
      import("@/lib/demo-data-service").then(({ enableDemoMode }) => {
        enableDemoMode();
        // Force a page reload to restart with demo mode
        setTimeout(() => window.location.reload(), 2000);
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent error={this.state.error} reset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; reset: () => void }> = ({
  error,
  reset,
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <Card className="max-w-md w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Error de Conexión
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">
          Hubo un problema conectando con el servidor. Activando modo demo
          automáticamente...
        </p>

        {error?.message?.includes("Failed to fetch") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 Detectamos problemas de red. La aplicación se reiniciará en
              modo demo en unos segundos.
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <Button
            onClick={reset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            Recargar Página
          </Button>
        </div>

        {error && (
          <details className="mt-4 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Detalles técnicos
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  </div>
);

export default ErrorBoundary;
