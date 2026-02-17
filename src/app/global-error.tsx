"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global error:", error);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#050505",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 900,
            fontStyle: "italic",
            marginBottom: "1rem",
          }}
        >
          Something went <span style={{ color: "#FF4D00" }}>wrong.</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: "#FF4D00",
            color: "#fff",
            border: "none",
            padding: "0.75rem 2rem",
            borderRadius: "0.75rem",
            fontWeight: 700,
            fontSize: "0.875rem",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          TRY AGAIN
        </button>
      </body>
    </html>
  );
}
