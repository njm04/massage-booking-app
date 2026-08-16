import { describe, expect, it } from "@jest/globals";
import userTypesRouter from "../../routes/userTypes.js";

describe("user types routes", () => {
  it("registers the expected user type endpoints", () => {
    const routes = userTypesRouter.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    expect(routes).toEqual(
      expect.arrayContaining([
        { path: "/", methods: ["get"] },
        { path: "/", methods: ["post"] },
      ]),
    );
  });
});
