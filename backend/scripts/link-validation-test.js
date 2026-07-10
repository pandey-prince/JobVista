import {
  classifyLinkCheckResult,
  containsDeadJobPhrase,
  isDeadJobHttpStatus,
} from "../utils/deadJobHeuristics.js";
import { getScrapedJobKey } from "../services/scrapedJobCleanup.service.js";

const results = [];

const pass = (name, detail = "") => {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
};

const fail = (name, detail = "") => {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
};

const assert = (name, condition, detail = "") => {
  if (condition) pass(name, detail);
  else fail(name, detail || "Assertion failed");
};

console.log("\n=== Link Validation Unit Tests ===\n");

assert("404 is dead status", isDeadJobHttpStatus(404));
assert("410 is dead status", isDeadJobHttpStatus(410));
assert("200 is not dead status", !isDeadJobHttpStatus(200));

assert(
  "Detects job not found phrase",
  containsDeadJobPhrase("<title>Job not found</title>"),
);
assert(
  "Detects position closed phrase",
  containsDeadJobPhrase("This position closed yesterday"),
);
assert(
  "Ignores normal job page",
  !containsDeadJobPhrase("<h1>Software Engineer</h1><p>Apply now</p>"),
);

assert(
  "Classifies HTTP 404 as dead",
  classifyLinkCheckResult({ status: 404, body: "" }).status === "dead",
);
assert(
  "Classifies live page as alive",
  classifyLinkCheckResult({ status: 200, body: "<h1>Backend Developer</h1>" }).status ===
    "alive",
);
assert(
  "Classifies dead phrase on 200 as dead",
  classifyLinkCheckResult({ status: 200, body: "Job not found" }).status === "dead",
);
assert(
  "Classifies 403 as inconclusive",
  classifyLinkCheckResult({ status: 403, body: "" }).status === "inconclusive",
);
assert(
  "Classifies 429 as inconclusive",
  classifyLinkCheckResult({ status: 429, body: "" }).status === "inconclusive",
);

assert(
  "Scraped job key format",
  getScrapedJobKey("507f1f77bcf86cd799439011") === "scraped-507f1f77bcf86cd799439011",
);

const failed = results.filter((r) => !r.ok);
console.log(`\n=== Results: ${results.length - failed.length}/${results.length} passed ===\n`);
process.exit(failed.length > 0 ? 1 : 0);
