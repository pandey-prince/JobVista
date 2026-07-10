import cron from "node-cron";
import { runDailyAlertDigest } from "../services/alertDigest.service.js";

let isRunning = false;

export const startAlertScheduler = () => {
  const schedule = process.env.ALERT_DIGEST_CRON || "30 14 * * *";

  cron.schedule(schedule, async () => {
    if (isRunning) {
      console.log("[AlertScheduler] Skipping — digest already running");
      return;
    }

    isRunning = true;
    try {
      console.log("[AlertScheduler] Running daily alert digest");
      await runDailyAlertDigest();
    } catch (error) {
      console.error("[AlertScheduler] Digest failed:", error.message);
    } finally {
      isRunning = false;
    }
  });

  console.log(`[AlertScheduler] Active with schedule: ${schedule} (UTC)`);
};
