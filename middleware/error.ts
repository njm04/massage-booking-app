import type { NextFunction, Request, Response } from "express";
import winston from "winston";

export default (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  winston.error(err.message, err);
  res.status(500).send("Something failed");
};
