import type { Request, Response } from "express";
import Joi from "joi";
import { UserType, validate } from "../models/userType.model.js";

const validateUserType = (req: Record<string, any>) => validate(req);

export const getUserTypes = async (_req: Request, res: Response) => {
  const types = await UserType.find().select("_id name");
  res.send(types);
};

export const createUserType = async (req: Request, res: Response) => {
  const { error } = validateUserType(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const name = req.body.name.toLowerCase();
  let type = await UserType.findOne({ name });
  if (type) return res.status(400).send("The user type already exists");

  type = new UserType({
    name: req.body.name,
  });

  await type.save();
  res.send(type);
};
