import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { getTherapists } from "../../controllers/therapist.controller.js";
import { Therapist } from "../../models/therapist.model.js";

describe("therapist controller", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("returns active therapists in deterministic order without private fields", async () => {
    const therapists = [
      {
        _id: "therapist-1",
        firstName: "Alex",
        lastName: "Smith",
        isAvailable: true,
        email: "private@example.com",
        reservations: [{ _id: "reservation-1" }],
      },
    ];
    const lean = jest.fn().mockImplementation(async () => therapists);
    const sort = jest.fn().mockReturnValue({ lean });
    const select = jest.fn().mockReturnValue({ sort });
    jest.spyOn(Therapist, "find").mockReturnValue({ select } as any);
    const res = { send: jest.fn() } as any;

    await getTherapists({} as any, res);

    expect(Therapist.find).toHaveBeenCalledWith({
      status: "active",
      isDeleted: false,
    });
    expect(select).toHaveBeenCalledWith("_id firstName lastName");
    expect(sort).toHaveBeenCalledWith({
      firstName: 1,
      lastName: 1,
      _id: 1,
    });
    expect(lean).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith([
      {
        _id: "therapist-1",
        firstName: "Alex",
        lastName: "Smith",
      },
    ]);
  });

  it("returns an empty list when there are no active therapists", async () => {
    const lean = jest.fn().mockImplementation(async () => []);
    const sort = jest.fn().mockReturnValue({ lean });
    const select = jest.fn().mockReturnValue({ sort });
    jest.spyOn(Therapist, "find").mockReturnValue({ select } as any);
    const res = { send: jest.fn() } as any;

    await getTherapists({} as any, res);

    expect(res.send).toHaveBeenCalledWith([]);
  });
});
