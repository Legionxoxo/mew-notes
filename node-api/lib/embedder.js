const PYTHON_API_URL = process.env.PYTHON_API_URL;

export async function embedChunks(chunks) {
    const res = await fetch(`${PYTHON_API_URL}/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: chunks }),
    });

    const data = await res.json();
    const embeddings = data.embeddings.map((embedding, i) => ({
        text: chunks[i],
        embedding,
    }));

    return embeddings;
}
