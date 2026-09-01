import type { Request, Response } from "express";
import { Therapist } from "../models/therapist.model.js";

export const getTherapists = async (_req: Request, res: Response) => {
  const therapists = await Therapist.find({
    status: "active",
    isDeleted: false,
  })
    .select("_id firstName lastName")
    .sort({ firstName: 1, lastName: 1, _id: 1 })
    .lean();

  res.send(
    therapists.map(({ _id, firstName, lastName }) => ({
      _id,
      firstName,
      lastName,
    })),
  );
};
