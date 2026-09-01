import { describe, expect, it, jest } from "@jest/globals";
import { getTherapists } from "../../controllers/therapist.controller.js";
import auth from "../../middleware/auth.js";
import therapistsRouter from "../../routes/therapists.js";

describe("therapists routes", () => {
  it("registers the therapist directory endpoint", () => {
    const routes = therapistsRouter.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    expect(routes).toEqual([{ path: "/", methods: ["get"] }]);
  });

  it("runs authentication and role authorization before the controller", () => {
    const route = therapistsRouter.stack.find(
      (layer: any) => layer.route?.path === "/" && layer.route.methods.get,
    )?.route;

    expect(route).toBeDefined();
    expect(route!.stack).toHaveLength(3);
    expect(route!.stack[0].handle).toBe(auth);
    expect(route!.stack[1].handle.name).toBe("requireRolesMiddleware");
    expect(route!.stack[2].handle).toBe(getTherapists);
  });

  it.each(["admin", "customer", "therapist"])(
    "allows the %s role through the route authorization middleware",
    (roleName) => {
      const route = therapistsRouter.stack.find(
        (layer: any) => layer.route?.path === "/" && layer.route.methods.get,
      )?.route;
      const req = { user: { userType: { name: roleName } } } as any;
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
      const next = jest.fn();

      route!.stack[1].handle(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    },
  );
});
