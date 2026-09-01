import type { NextFunction, Request, Response } from "express";

export default (...allowedRoles: string[]) => {
  const allowedRoleNames = new Set(allowedRoles);

  return function requireRolesMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const userType = req.user?.userType;
    const roleName =
      typeof userType === "object" && userType !== null
        ? userType.name
        : undefined;

    if (!roleName || !allowedRoleNames.has(roleName)) {
      return res.status(403).send("Access denied");
    }

    next();
  };
};
