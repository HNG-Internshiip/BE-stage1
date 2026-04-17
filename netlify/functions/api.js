const serverless = require("serverless-http");
const express    = require("express");

let handler;

module.exports.handler = async (event, context) => {
  if (!handler) {
    // Dynamically import ESM modules at runtime
    const { profilesRouter } = await import("../../routes/profiles.js");

    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      next();
    });
    app.options("*", (req, res) => res.sendStatus(204));
    app.use("/api/profiles", profilesRouter);

    handler = serverless(app);
  }
  return handler(event, context);
};