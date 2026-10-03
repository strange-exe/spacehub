import { Component, type ErrorInfo, type ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { describeError } from "@/lib/http";

export type ErrorFallback = (props: { error: unknown; retry: () => void }) => ReactNode;

interface InnerProps {
  children: ReactNode;
  onReset: () => void;
  resetKey?: string;
  fallback?: ErrorFallback;
}
interface State {
  error: unknown;
  resetKey?: string;
}

class Inner extends Component<InnerProps, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error };
  }

  // Navigating elsewhere (new resetKey) clears the error automatically.
  static getDerivedStateFromProps(props: InnerProps, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("[SpaceHub]", error, info.componentStack);
  }

  retry = (): void => {
    this.props.onReset();
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback({ error: this.state.error, retry: this.retry });
    const { title, hint } = describeError(this.state.error);
    return (
      <div role="alert" className="mx-auto max-w-2xl px-6 pb-24 pt-40">
        <p className="catalog text-signal">Transmission interrupted</p>
        <h1 className="mt-3 font-display text-5xl text-bone">{title}</h1>
        <p className="mt-4 max-w-prose text-dust">{hint}</p>
        <button type="button" className="btn-solid mt-8" onClick={this.retry}>
          Try again
        </button>
      </div>
    );
  }
}

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
  fallback?: ErrorFallback;
}

export function ErrorBoundary({ children, resetKey, fallback }: ErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <Inner onReset={reset} resetKey={resetKey} fallback={fallback}>
          {children}
        </Inner>
      )}
    </QueryErrorResetBoundary>
  );
}
