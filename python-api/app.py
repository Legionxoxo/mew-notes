# embed_server.py
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
model = SentenceTransformer("all-MiniLM-L6-v2")

@app.route("/embed", methods=["POST"])
def embed():
    data = request.json
    texts = data.get("texts", [])
    embeddings = model.encode(texts).tolist()
    return jsonify({"embeddings": embeddings})

if __name__ == "__main__":
    host = os.getenv("EMBED_SERVER_HOST", "127.0.0.1")
    port = int(os.getenv("EMBED_SERVER_PORT", "5005"))
    app.run(host=host, port=port)
