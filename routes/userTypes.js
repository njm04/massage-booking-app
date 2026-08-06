import express from "express";
import { UserType, validate } from "../models/userType.model.js";
import auth from "../middleware/auth.js";
const router = express.Router();

router.get("/", auth, async (req, res) => {
  const types = await UserType.find().select("_id name");
  res.send(types);
});

router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const name = req.body.name.toLowerCase();
  let type = await UserType.findOne({ name });
  if (type) return res.status(400).send("The user type already exists");

  type = new UserType({
    name: req.body.name,
  });

  await type.save();

  res.send(type);
});

export default router;
