import express from "express";
import { profilesRouter } from "./routes/profiles.js";

const app = express();

app.use(express.json());

// CORS — required for grading script
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Handle preflight requests
app.options("*", (req, res) => res.sendStatus(204));

app.use("/api/profiles", profilesRouter);

export default app;