# mew Notes

mew Notes is a full-stack note-taking application built with a microservices architecture. It uses Next.js for the frontend, a Node.js API as a backend, and a Python API for generating sentence embeddings. The entire application is containerized using Docker and can be orchestrated with Docker Compose.

## Architecture

The application is composed of three main services:

-   **`frontend`**: A [Next.js](https://nextjs.org/) application that provides the user interface. It runs on port `3000`.
-   **`backend`**: A [Node.js](https://nodejs.org/) API that handles the primary application logic. It runs on port `4000`.
-   **`pythonapi`**: A [Python](https://www.python.org/) with [Flask](https://flask.palletsprojects.com/) API that serves a sentence-transformer model to generate embeddings for text. It runs on port `5000`.

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

-   [Docker](https://www.docker.com/get-started)
-   [Docker Compose](https://docs.docker.com/compose/install/)

### Running the application

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Legionxoxo/mew-notes.git
    cd docker-notes
    ```

2.  **Build and run the services:**
    Use Docker Compose to build the images and start the containers.

    ```bash
    docker compose up --build
    ```

    The `--build` flag forces a rebuild of the images if there are any changes.

3.  **Access the application:**
    -   Frontend (Next.js App): `http://localhost:3000`
    -   Backend (Node.js API): `http://localhost:4000`
    -   Python API: `http://localhost:5000`

## Note -> put your cloud pgvector db like neondb key inside node-api(DATABASE_URL)

### Stopping the application

To stop the running containers, press `Ctrl+C` in the terminal where `docker compose up` is running.

To stop and remove the containers, you can run:

```bash
docker compose down
```
