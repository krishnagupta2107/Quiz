import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleProcessPDF } from "./routes/pdf-processing";
import { handleGenerateQuestions } from "./routes/question-generation";
import { handleTestQuestions } from "./routes/test-questions";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: [
      'http://localhost:8080',
      'http://localhost:8081',
      'https://quiz-kizi.onrender.com',
      'https://*.onrender.com'
    ],
    credentials: true
  }));
  app.use(express.json({ limit: '50mb' })); // Increased limit for PDF uploads
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // PDF processing and question generation routes
  app.post("/api/process-pdf", handleProcessPDF);
  app.post("/api/generate-questions", handleGenerateQuestions);
  app.get("/api/test-questions", handleTestQuestions);

  return app;
}
