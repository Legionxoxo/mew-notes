export function chunkText(text, maxLen = 500) {
    const lines = text.split("\n");
    const chunks = [];
    let chunk = "";
    for (const line of lines) {
        if ((chunk + line).length > maxLen) {
            chunks.push(chunk.trim());
            chunk = "";
        }
        chunk += line + "\n";
    }
    if (chunk.trim()) chunks.push(chunk.trim());
    return chunks;
}
