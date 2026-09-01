import { describe, expect, it } from "@jest/globals";
import userTypesRouter from "../../routes/userTypes.js";
import auth from "../../middleware/auth.js";
import admin from "../../middleware/admin.js";

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

  it("requires admin authorization for listing and creating user types", () => {
    const routes = userTypesRouter.stack
      .filter((layer: any) => layer.route?.path === "/")
      .map((layer: any) => layer.route);

    for (const route of routes) {
      expect(route.stack.slice(0, 2).map((layer: any) => layer.handle)).toEqual([
        auth,
        admin,
      ]);
    }
  });
});
