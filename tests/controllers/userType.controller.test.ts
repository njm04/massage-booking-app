import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  createUserType,
  getUserTypes,
} from "../../controllers/userType.controller.js";
import { UserType } from "../../models/userType.model.js";

describe("user type controller", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("returns all user types", async () => {
    const mockTypes = [{ _id: "u1", name: "customer" }];
    const select = jest.fn().mockImplementation(async () => mockTypes);
    jest.spyOn(UserType, "find").mockReturnValue({ select } as any);

    const res = { send: jest.fn() } as any;

    await getUserTypes({} as any, res);

    expect(UserType.find).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith("_id name");
    expect(res.send).toHaveBeenCalledWith(mockTypes);
  });

  it("creates a user type when it does not already exist", async () => {
    const req = { body: { name: "Admin" } } as any;
    const res = { send: jest.fn() } as any;

    jest.spyOn(UserType, "findOne").mockResolvedValue(null);
    const save = jest.fn().mockImplementation(async () => undefined);
    const constructorSpy = jest.spyOn(global, "Date");

    const saveSpy = jest
      .spyOn(UserType.prototype, "save")
      .mockImplementation(save as any);

    await createUserType(req, res);

    expect(UserType.findOne).toHaveBeenCalledWith({ name: "admin" });
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalled();

    constructorSpy.mockRestore();
  });

  it("rejects duplicate user types", async () => {
    const req = { body: { name: "Admin" } } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(UserType, "findOne").mockResolvedValue({ name: "admin" } as any);

    await createUserType(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("The user type already exists");
  });
});
