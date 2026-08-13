import { describe, expect, it, jest } from "@jest/globals";
import errorMiddleware from "../../middleware/error.js";

describe("error middleware", () => {
  it("returns a generic internal server error", () => {
    const error = new Error("database failure");
    const response = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;

    errorMiddleware(error, {} as any, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith("Something failed");
  });
});
