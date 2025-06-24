import "dotenv/config";
import express from "express";
import morgan from "morgan";
import uploadRoute from "./routes/upload.js";
import searchRoute from "./routes/search.js";
import { initDB } from "./lib/db.js";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(morgan("dev"));

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(
    cors({
        origin: CLIENT_ORIGIN,
        credentials: true,
    })
);

app.use(express.json());

app.use("/upload", uploadRoute);
app.use("/search", searchRoute);

await initDB();

const PORT = process.env.PORT;
app.listen(PORT, "0.0.0.0", () =>
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
);
