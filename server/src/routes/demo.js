import express from "express";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * GET /api/ping
 *
 * This is the protected demo endpoint.
 * The rateLimiter middleware runs FIRST before this handler.
 * If the client is rate limited, they never reach this code —
 * the middleware sends back 429 and stops the request there.
 * Only allowed requests make it through to the res.json() below.
 */
router.get("/ping", rateLimiter, (req, res) => {
  res.json({
    success: true,
    message: "Request allowed!",
    timestamp: new Date().toISOString(),
    clientIp: req.ip,
  });
});

export default router;