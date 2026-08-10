import startCronJob from "./startup/cronJob.js";
import express from "express";
import winston from "winston";
import "./startup/env.js";
import logging from "./startup/logging.js";
import routes from "./startup/routes.js";
import db from "./startup/db.js";
import config from "./startup/config.js";
import prod from "./startup/prod.js";

const app = express();
logging();
config();
routes(app);
void db();
prod(app);
startCronJob();

const startServer = (port, attempt = 1) => {
  const server = app.listen(port, () =>
    winston.info(`Server is running on port: ${port}`),
  );

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && attempt < 10) {
      winston.warn(`Port ${port} is already in use. Trying ${port + 1}...`);
      server.close();
      startServer(port + 1, attempt + 1);
      return;
    }

    winston.error("Server failed to start", error);
  });

  return server;
};

const PORT = Number(process.env.PORT) || 5000;
const server = startServer(PORT);

export default server;
