import type { NextFunction, Request, Response } from "express";

export default (req: Request, res: Response, next: NextFunction) => {
  const userType = req.user?.userType;
  if (
    typeof userType !== "object" ||
    userType === null ||
    userType.name !== "admin"
  )
    return res.status(403).send("Access denied");

  next();
};
