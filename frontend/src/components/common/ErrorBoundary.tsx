import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Reusable ErrorBoundary to prevent specific component crashes (like Recharts runtime errors)
 * from taking down the entire application or dashboard.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.componentName || "Component"}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/30 p-6 text-center dark:border-red-900/30 dark:bg-red-900/5">
            <svg
              className="mb-3 h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-sm font-bold text-red-800 dark:text-red-400">
              Gráfico no disponible
            </h3>
            <p className="mt-1 text-xs text-red-600 dark:text-red-500/80">
              Hubo un error al renderizar esta visualización.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
