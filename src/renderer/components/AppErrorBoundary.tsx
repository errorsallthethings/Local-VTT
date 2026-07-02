import React from "react";
import { getRendererErrorMessage } from "./rendererErrorMessages";

const SHOW_RENDERER_ERROR_DETAILS = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

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

    const message = getRendererErrorMessage(this.state.error);

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
        <h1 style={{ margin: "0 0 12px", fontSize: 22 }}>{message.title}</h1>
        <p style={{ maxWidth: 760, color: "#aeb8c4", lineHeight: 1.5 }}>
          {message.body} {message.recovery}
        </p>
        {SHOW_RENDERER_ERROR_DETAILS ? (
          <>
            <p style={{ maxWidth: 760, color: "#aeb8c4", lineHeight: 1.5 }}>
              Dev details were logged as
              <code style={{ margin: "0 4px" }}>LOCALVTT_RENDERER_ERROR_BOUNDARY</code>.
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
          </>
        ) : null}
      </main>
    );
  }
}
