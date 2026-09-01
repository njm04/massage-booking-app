import { describe, expect, it, jest } from "@jest/globals";
import requireRoles from "../../middleware/requireRoles.js";

describe("requireRoles middleware", () => {
  const middleware = requireRoles("admin", "customer", "therapist");

  it.each(["admin", "customer", "therapist"])(
    "allows the %s role",
    (roleName) => {
      const req = { user: { userType: { _id: "role-1", name: roleName } } } as any;
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["unsupported role", { user: { userType: { name: "auditor" } } }],
    ["string role shape", { user: { userType: "customer" } }],
    ["missing role name", { user: { userType: { _id: "role-1" } } }],
    ["missing user", {}],
  ])("rejects a request with %s", (_description, request) => {
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn();

    middleware(request as any, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith("Access denied");
    expect(next).not.toHaveBeenCalled();
  });
});
