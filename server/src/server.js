import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import resumeRoutes from "./routes/resume.js";

dotenv.config();

const app = express();

// ✅ parse JSON
app.use(express.json({ limit: "2mb" }));

// ✅ basic request logging (helps you confirm frontend is hitting backend)
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// ✅ CORS: allow both localhost + 127.0.0.1 (Vite sometimes uses 127)
app.use(
  cors({
    origin: [process.env.CLIENT_ORIGIN, "http://127.0.0.1:5173"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Resume Builder API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ Missing MONGO_URI in .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected:", process.env.MONGO_URI);

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

start();
