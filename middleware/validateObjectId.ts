import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export default (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const isValidId =
    typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

  if (!isValidId) return res.status(404).send("Invalid id");

  next();
};
