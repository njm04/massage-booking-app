import { describe, expect, it } from "@jest/globals";
import authRouter from "../../routes/auth.js";

describe("auth routes", () => {
  it("registers the login endpoint", () => {
    const routes = authRouter.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    expect(routes).toContainEqual({ path: "/", methods: ["post"] });
  });

  it("registers the email confirmation endpoint", () => {
    const routes = authRouter.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    expect(routes).toContainEqual({
      path: "/confirmation/:token",
      methods: ["get"],
    });
  });
});
