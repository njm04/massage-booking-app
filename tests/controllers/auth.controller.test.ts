import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import bcrypt from "bcryptjs";
import { canUserLogin, login } from "../../controllers/auth.controller.js";
import { User } from "../../models/user.model.js";

describe("auth controller", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    process.env.booking_jwtPrivateKey = "test-secret";
  });

  it("blocks customers who have not verified their email", () => {
    expect(
      canUserLogin({
        confirmed: false,
        status: "active",
        userTypeName: "customer",
      }),
    ).toEqual({ allowed: false, reason: "Please verify your email." });
  });

  it("blocks suspended users", () => {
    expect(
      canUserLogin({
        confirmed: true,
        status: "suspend",
        userTypeName: "customer",
      }),
    ).toEqual({ allowed: false, reason: "Account has been suspended" });
  });

  it("allows verified active customers", () => {
    expect(
      canUserLogin({
        confirmed: true,
        status: "active",
        userTypeName: "customer",
      }),
    ).toEqual({ allowed: true, reason: null });
  });

  it("returns a JWT token for a valid user", async () => {
    const mockUser = {
      _id: "user-1",
      password: "hashed-pass",
      status: "active",
      confirmed: true,
      userType: { _id: "type-1", name: "customer" },
      generateAuthToken: jest.fn().mockReturnValue("token-123"),
    };

    const query = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockImplementation(async () => mockUser),
    };

    jest.spyOn(User, "findOne").mockReturnValue(query as any);
    jest.spyOn(bcrypt, "compare").mockImplementation(async () => true);

    const req = {
      body: { email: "test@example.com", password: "secret" },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    await login(req, res);

    expect(query.select).toHaveBeenCalledWith(
      "+password _id name firstName lastName status confirmed userType",
    );
    expect(bcrypt.compare).toHaveBeenCalledWith("secret", "hashed-pass");
    expect(res.send).toHaveBeenCalledWith("token-123");
  });
});
