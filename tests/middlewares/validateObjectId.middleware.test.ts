import { describe, expect, it, jest } from "@jest/globals";
import validateObjectId from "../../middleware/validateObjectId.js";

describe("validateObjectId middleware", () => {
  it("rejects invalid id values", () => {
    const req = { params: { id: "bad-id" } } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn();

    validateObjectId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Invalid id");
    expect(next).not.toHaveBeenCalled();
  });

  it("allows valid Mongo ObjectIds", () => {
    const req = { params: { id: "507f1f77bcf86cd799439011" } } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn();

    validateObjectId(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
