import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/**
 * Unauthenticated version probe. Returns the git commit baked into the image at
 * build time (Dockerfile ARG GIT_SHA → ENV). CI polls this after a deploy to
 * confirm the freshly-pushed image is actually live before running prod e2e —
 * a rolling restart keeps serving 200s, so a SHA check is the only reliable
 * "the new build is up" signal.
 */
export const GET = (req: MedusaRequest, res: MedusaResponse) => {
  res.json({ sha: process.env.GIT_SHA ?? "unknown" });
};
