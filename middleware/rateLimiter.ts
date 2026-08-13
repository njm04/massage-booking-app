import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";

type RateLimiterOptions = {
  windowMs: number;
  max: number;
  message: string;
};

// Shared factory so every public, unauthenticated endpoint uses the same IPv6-safe key generation.
export const createRateLimiter = ({
  windowMs,
  max,
  message,
}: RateLimiterOptions) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
  } satisfies Partial<Options>);
