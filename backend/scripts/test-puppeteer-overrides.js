import { scrapeAutoPuppeteer } from "../services/scrapers/autoPuppeteer.js";
import { getPuppeteerOverride } from "../data/puppeteerSelectors.js";

const companies = [
  "AMD",
  "Amazon",
  "GitHub",
  "Dell Technologies",
  "Hexaware",
  "IBM",
  "Shopify",
  "Splunk",
  "Zoho",
  "Ola",
  "Kotak Mahindra Bank",
  "Bajaj Finserv",
  "Nykaa",
  "Lenskart",
  "Chargebee",
  "HashiCorp",
  "Tata Digital",
  "Udaan",
];

const results = [];

for (const name of companies) {
  const override = getPuppeteerOverride(name);
  if (!override) {
    results.push({ name, status: "no override" });
    console.log(`• ${name} — no override`);
    continue;
  }

  const source = {
    companyName: name,
    name: `${name} Careers`,
    url: override.url,
    scraperType: "auto-puppeteer",
    selectors: override.selectors || {},
  };

  const started = Date.now();
  process.stdout.write(`… ${name} `);

  try {
    const jobs = await scrapeAutoPuppeteer(source);
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    results.push({
      name,
      status: "ok",
      count: jobs.length,
      sample: jobs[0]?.title?.slice(0, 60),
      elapsed,
    });
    console.log(`✓ ${jobs.length} jobs (${elapsed}s) — ${jobs[0]?.title?.slice(0, 50) || ""}`);
  } catch (error) {
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    results.push({ name, status: "fail", error: error.message.slice(0, 120), elapsed });
    console.log(`✗ ${error.message.slice(0, 80)} (${elapsed}s)`);
  }
}

const ok = results.filter((r) => r.status === "ok").length;
const fail = results.filter((r) => r.status === "fail").length;
console.log(`\nSummary: ${ok} ok, ${fail} failed, ${results.length} total\n`);

if (fail > 0) {
  process.exitCode = 1;
}
