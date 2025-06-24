import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files");
        const vaultname = formData.get("vaultname");

        if (!files.length) {
            return NextResponse.json(
                { error: "No files uploaded" },
                { status: 400 }
            );
        }

        // Forward to the real upload endpoint
        const cloudForm = new FormData();
        const vaultnameValue =
            typeof vaultname === "string" ? vaultname : String(vaultname);
        cloudForm.append("vaultname", vaultnameValue);

        for (const file of files) {
            if (file instanceof Blob) {
                // @ts-ignore
                const fileName = file.name || "file";
                cloudForm.append("files", file, fileName);
            }
        }
        const apiUrl = process.env.BACKEND_API_URL;

        const cloudRes = await fetch(`${apiUrl}/upload`, {
            method: "POST",
            body: cloudForm,
        });

        const cloudData = await cloudRes.json();
        return NextResponse.json(cloudData, { status: cloudRes.status });
    } catch (err) {
        console.error("Proxy upload error:", err);
        return NextResponse.json(
            { error: "Proxy upload failed", details: String(err) },
            { status: 500 }
        );
    }
}
