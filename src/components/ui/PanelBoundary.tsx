"use client";

// Error boundary per panel: bila satu panel error, panel lain (terutama peta) tetap jalan.
import { Component, type ReactNode } from "react";

type Props = { name: string; children: ReactNode };
type State = { error: Error | null };

export class PanelBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[${this.props.name}]`, error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="bg-surface-strong flex flex-1 flex-col items-start justify-center gap-3 border border-red-500/50 p-4 text-sm shadow-[0_0_0_1px_var(--border)_inset]"
        >
          <p className="light:text-red-700 font-medium text-red-500">
            {this.props.name} failed to load.
          </p>
          <button
            type="button"
            className="border-border text-kapur-muda hover:bg-foreground/5 border px-3 py-1.5 transition-colors"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
