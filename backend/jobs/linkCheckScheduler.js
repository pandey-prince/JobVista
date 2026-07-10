import cron from "node-cron";
import { checkAllActiveJobLinks } from "../services/linkCheck.service.js";

let isRunning = false;

const runLinkCheckSafely = async (label) => {
  if (isRunning) {
    console.log(`[LinkCheckScheduler] Skipping ${label} — link check already in progress`);
    return;
  }

  isRunning = true;
  try {
    console.log(`[LinkCheckScheduler] Starting ${label}`);
    await checkAllActiveJobLinks();
  } catch (error) {
    console.error(`[LinkCheckScheduler] ${label} failed:`, error.message);
  } finally {
    isRunning = false;
  }
};

export const startLinkCheckScheduler = () => {
  const enabled = process.env.LINK_CHECK_ENABLED === "true";
  if (!enabled) {
    console.log("[LinkCheckScheduler] Disabled (set LINK_CHECK_ENABLED=true to enable)");
    return;
  }

  const schedule = process.env.LINK_CHECK_CRON || "0 3 * * *";
  cron.schedule(schedule, () => runLinkCheckSafely("scheduled link check"));

  console.log(`[LinkCheckScheduler] Active with schedule: ${schedule} (UTC)`);
};
