import express from "express";
import { getState } from "../algorithms/tokenBucket.js";

const router = express.Router();

/**
 * GET /api/status
 *
 * Returns the current rate limit state for the requesting client.
 * This endpoint is NOT rate limited — it's read-only and used
 * by the UI dashboard to show live token count without
 * consuming any tokens.
 */
router.get("/status", (req, res) => {
  const clientKey = req.ip;
  const state = getState(clientKey);

  res.json({
    clientIp: clientKey,
    tokensRemaining: state.tokens,
    capacity: state.capacity,
    algorithm: "token-bucket",
  });
});

export default router;