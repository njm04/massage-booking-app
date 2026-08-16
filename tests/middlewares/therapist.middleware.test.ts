import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import therapistMiddleware from "../../middleware/therapist.js";
import { UserType } from "../../models/userType.model.js";

describe("therapist middleware", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("allows therapist users", async () => {
    const req = { user: { userType: "t1" } } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn();

    jest
      .spyOn(UserType, "findById")
      .mockResolvedValue({ name: "therapist" } as any);

    await therapistMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects non-therapist users", async () => {
    const req = { user: { userType: "t1" } } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn();

    jest
      .spyOn(UserType, "findById")
      .mockResolvedValue({ name: "customer" } as any);

    await therapistMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith("Access denied");
    expect(next).not.toHaveBeenCalled();
  });
});
