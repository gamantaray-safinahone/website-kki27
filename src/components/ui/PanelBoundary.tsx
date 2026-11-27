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
        <div className="rounded-xl border border-red-500/40 p-4 text-sm">
          <p className="font-medium text-red-600">
            {this.props.name} failed to load.
          </p>
          <button
            type="button"
            className="mt-2 rounded-md border border-neutral-500/40 px-3 py-1"
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
