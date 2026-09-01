import { describe, expect, it } from "@jest/globals";
import usersRouter from "../../routes/users.js";
import auth from "../../middleware/auth.js";
import admin from "../../middleware/admin.js";

describe("users routes", () => {
  it("registers the expected user endpoints", () => {
    const routes = usersRouter.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    expect(routes).toEqual(
      expect.arrayContaining([
        { path: "/", methods: ["get"] },
        { path: "/me", methods: ["get"] },
        { path: "/", methods: ["post"] },
        { path: "/create-user", methods: ["post"] },
        { path: "/:id", methods: ["put"] },
        { path: "/:id", methods: ["delete"] },
        { path: "/change-password/:id", methods: ["put"] },
        { path: "/update-status/:id", methods: ["put"] },
      ]),
    );
  });

  it("requires admin authorization to list users", () => {
    const route = usersRouter.stack.find(
      (layer: any) => layer.route?.path === "/" && layer.route.methods.get,
    )?.route;

    expect(route).toBeDefined();
    expect(route!.stack.slice(0, 2).map((layer: any) => layer.handle)).toEqual([
      auth,
      admin,
    ]);
  });
});
