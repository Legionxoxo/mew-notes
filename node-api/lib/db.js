import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

export async function initDB() {
    await client.query(`
        CREATE EXTENSION IF NOT EXISTS vector;

        CREATE TABLE IF NOT EXISTS documents (
            id SERIAL PRIMARY KEY,
            filename TEXT,
            content TEXT,
            embedding VECTOR(384),
            vaultname TEXT
        );
    `);

    // Add 'filename' column if it doesn't exist
    try {
        await client.query(`
            ALTER TABLE documents ADD COLUMN IF NOT EXISTS filename TEXT;
        `);
    } catch (err) {
        console.error("Failed to add filename column:", err.message);
    }

    // Add 'vaultname' column if it doesn't exist
    try {
        await client.query(`
            ALTER TABLE documents ADD COLUMN IF NOT EXISTS vaultname TEXT;
        `);
    } catch (err) {
        console.error("Failed to add vaultname column:", err.message);
    }

    // Ensure embedding vector has correct dimension
    try {
        await client.query(`
            ALTER TABLE documents ALTER COLUMN embedding TYPE vector(384);
        `);
    } catch (err) {
        if (!err.message.includes("already of type vector(384)")) {
            console.error("Failed to alter vector dimension:", err.message);
        }
    }
}

// 📝 Insert with filename and vaultname
export async function insertEmbeddings(docs, filename, vaultname) {
    // 1. Delete old data for this filename & vaultname
    await client.query(
        `DELETE FROM documents WHERE filename = $1 AND vaultname = $2`,
        [filename, vaultname]
    );

    // 2. Insert new data
    for (const doc of docs) {
        await client.query(
            `INSERT INTO documents (filename, vaultname, content, embedding)
             VALUES ($1, $2, $3, $4)`,
            [filename, vaultname, doc.text, `[${doc.embedding.join(",")}]`]
        );
    }
}

// 🔍 Search and return filename, vaultname, and content
export async function searchSimilar(queryEmbedding, limit = 5) {
    const pgEmbedding = `[${queryEmbedding.join(",")}]`;
    const { rows } = await client.query(
        `SELECT filename, vaultname, content, embedding <#> $1 AS distance
         FROM documents
         ORDER BY distance ASC
         LIMIT $2`,
        [pgEmbedding, limit]
    );
    return rows;
}
