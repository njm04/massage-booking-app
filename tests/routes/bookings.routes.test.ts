import { describe, expect, it } from "@jest/globals";
import bookingsRouter from "../../routes/bookings.js";

describe("bookings routes", () => {
  it("registers the expected booking endpoints", () => {
    const routes = bookingsRouter.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    expect(routes).toEqual(
      expect.arrayContaining([
        { path: "/", methods: ["post"] },
        { path: "/", methods: ["get"] },
        { path: "/:id", methods: ["put"] },
        { path: "/delete/:id", methods: ["put"] },
        { path: "/update-view/:id", methods: ["get"] },
        { path: "/update-status/:id", methods: ["put"] },
      ]),
    );
  });
});
