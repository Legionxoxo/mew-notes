import express from "express";
import { embedChunks } from "../lib/embedder.js";
import { searchSimilar } from "../lib/db.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    try {
        const [{ embedding }] = await embedChunks([query]);
        const results = await searchSimilar(embedding);
        res.json({ results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Search failed" });
    }
});

export default router;
