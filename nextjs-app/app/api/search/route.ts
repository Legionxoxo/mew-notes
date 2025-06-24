import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query } = body;

        if (!query || typeof query !== "string") {
            return NextResponse.json(
                { error: "No query provided" },
                { status: 400 }
            );
        }

        const apiUrl = process.env.BACKEND_API_URL;
        if (!apiUrl) {
            throw new Error("BACKEND_API_URL is not defined");
        }

        const backendRes = await fetch(`${apiUrl}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Proxy search error:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            { error: "Proxy search failed", details: errorMessage },
            { status: 500 }
        );
    }
}
