import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: "#000", minHeight: "100vh", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 32, fontFamily: "'Outfit',sans-serif", color: "#d4d4d8",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 24, textAlign: "center", maxWidth: 300 }}>
            An unexpected error occurred. Please refresh to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "14px 32px", borderRadius: 16, background: "linear-gradient(135deg,#C8FA64,#86EFAC)",
              border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif",
              fontSize: 15, fontWeight: 800, color: "#000",
            }}
          >
            Refresh App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
