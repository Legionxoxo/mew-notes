import express from "express";
import multer from "multer";
import { parseMarkdown } from "../lib/parser.js";
import { chunkText } from "../lib/chunker.js";
import { embedChunks } from "../lib/embedder.js";
import { insertEmbeddings } from "../lib/db.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.array("files", 10), async (req, res) => {
    try {
        const results = [];

        const vaultname = req.body.vaultname;
        console.log("body", req.body); // 👈 Get vaultname here
        console.log("Vault Name:", vaultname);

        for (const file of req.files) {
            console.log("file data", file);
            const rawText = file.buffer.toString("utf-8");
            const chunks = chunkText(parseMarkdown(rawText));
            const embedded = await embedChunks(chunks);
            await insertEmbeddings(embedded, file.originalname, vaultname);
            results.push(file.originalname);
        }

        res.json({
            message: "Files uploaded and indexed (memory only)",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Upload failed" });
    }
});

export default router;
