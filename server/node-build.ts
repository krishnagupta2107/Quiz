import path from "path";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Add health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Test endpoint to serve a static file
app.get("/test-static", (req, res) => {
  const testFile = path.join(distPath, "favicon.ico");
  if (fs.existsSync(testFile)) {
    res.sendFile(testFile);
  } else {
    res.status(404).json({ error: "Test file not found", path: testFile });
  }
});

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Debug logging to help troubleshoot path issues
console.log("Server build directory:", __dirname);
console.log("SPA dist path:", distPath);
console.log("Full SPA path:", path.resolve(distPath));

// Check if the SPA directory exists and what's in it
import fs from "fs";
try {
  const spaExists = fs.existsSync(distPath);
  console.log("SPA directory exists:", spaExists);
  
  if (spaExists) {
    const files = fs.readdirSync(distPath);
    console.log("Files in SPA directory:", files);
    
    const indexPath = path.join(distPath, "index.html");
    const indexExists = fs.existsSync(indexPath);
    console.log("index.html exists:", indexExists);
  }
} catch (error) {
  console.error("Error checking SPA directory:", error);
}

// Serve static files
app.use(express.static(distPath, {
  index: false, // Don't serve index.html automatically
  fallthrough: false // Don't fall through to next middleware if file not found
}));

// Add error handling for static files
app.use((err, req, res, next) => {
  if (err) {
    console.error("Static file serving error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
  next();
});

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  const indexPath = path.join(distPath, "index.html");
  console.log("Serving index.html from:", indexPath);
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(500).json({ error: "Failed to serve index.html", details: err.message });
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
