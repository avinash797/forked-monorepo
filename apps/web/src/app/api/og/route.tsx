import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "Forked";
  const subtitle =
    searchParams.get("subtitle") ||
    "Find the best dish in your city";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #221610 0%, #342219 100%)",
          padding: "60px",
        }}
      >
        {/* Fork icon */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          style={{ marginBottom: "30px" }}
        >
          <path
            d="M3 2v7c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V2"
            stroke="#FBBF24"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="bevel"
          />
          <path
            d="M9 2v20"
            stroke="#FBBF24"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="bevel"
          />
          <path
            d="M15 2v20"
            stroke="#FBBF24"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="bevel"
          />
          <path
            d="M12 12v8.5"
            stroke="#FBBF24"
            strokeWidth="5"
            strokeLinecap="square"
            strokeLinejoin="bevel"
          />
        </svg>

        <div
          style={{
            fontSize: "52px",
            fontWeight: 700,
            color: "#FFFFFF",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "16px",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#c9a492",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ color: "#ee6c2b", fontSize: "20px", fontWeight: 700 }}>
            Forked
          </span>
          <span style={{ color: "#9BA1A6", fontSize: "16px" }}>
            — Dish ratings, not restaurant ratings
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
