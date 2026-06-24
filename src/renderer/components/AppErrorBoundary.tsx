import React from "react";

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("LOCALVTT_RENDERER_ERROR_BOUNDARY", error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 24,
          background: "#101318",
          color: "#e8edf2",
          fontFamily: "system-ui, sans-serif"
        }}
      >
        <h1 style={{ margin: "0 0 12px", fontSize: 22 }}>Local VTT ran into a renderer error</h1>
        <p style={{ maxWidth: 760, color: "#aeb8c4", lineHeight: 1.5 }}>
          The app stopped rendering, but the window is still alive. Check the dev terminal or DevTools console for
          <code style={{ margin: "0 4px" }}>LOCALVTT_RENDERER_ERROR_BOUNDARY</code>
          details.
        </p>
        <pre
          style={{
            maxWidth: 960,
            overflow: "auto",
            marginTop: 20,
            padding: 16,
            border: "1px solid rgb(255 255 255 / 0.14)",
            borderRadius: 6,
            background: "rgb(0 0 0 / 0.28)",
            whiteSpace: "pre-wrap"
          }}
        >
          {this.state.error.stack ?? this.state.error.message}
        </pre>
      </main>
    );
  }
}
