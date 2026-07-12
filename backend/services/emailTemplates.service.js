const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.joblelo.online";

const jobRow = (job) => {
  const jobUrl = `${FRONTEND_URL}/description/${job.jobKey || job._id}`;
  const company = job.companyName || job.company?.name || "Company";
  const location = job.location || "India";
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee;">
        <a href="${jobUrl}" style="color:#6A38C2;font-weight:600;text-decoration:none;">${job.title}</a>
        <div style="color:#666;font-size:13px;margin-top:4px;">${company} · ${location}</div>
      </td>
    </tr>
  `;
};

export const buildDigestEmail = ({ userName, alertName, jobs }) => {
  const rows = jobs.slice(0, 10).map(jobRow).join("");
  const subject = `JobLeLo: ${jobs.length} new job${jobs.length === 1 ? "" : "s"} for "${alertName}"`;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h2 style="color:#6A38C2;margin-bottom:4px;">JobLeLo</h2>
      <p style="color:#555;">Hi ${userName || "there"},</p>
      <p style="color:#555;">Your alert <strong>${alertName}</strong> matched ${jobs.length} new IT opening${jobs.length === 1 ? "" : "s"}.</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="margin-top:20px;">
        <a href="${FRONTEND_URL}/jobs" style="background:#6A38C2;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Browse all jobs</a>
      </p>
      <p style="color:#999;font-size:12px;margin-top:24px;">Daily digest · Manage alerts at ${FRONTEND_URL}/alerts</p>
    </div>
  `;

  const text = `JobLeLo alert "${alertName}" matched ${jobs.length} jobs. Visit ${FRONTEND_URL}/jobs`;

  return { subject, html, text };
};

export const buildWatchlistEmail = ({ userName, companyName, jobs }) => {
  const rows = jobs.slice(0, 10).map(jobRow).join("");
  const subject = `JobLeLo: ${jobs.length} new job${jobs.length === 1 ? "" : "s"} at ${companyName}`;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h2 style="color:#6A38C2;margin-bottom:4px;">JobLeLo</h2>
      <p style="color:#555;">Hi ${userName || "there"},</p>
      <p style="color:#555;"><strong>${companyName}</strong> just posted ${jobs.length} new IT role${jobs.length === 1 ? "" : "s"} on their career page.</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="margin-top:20px;">
        <a href="${FRONTEND_URL}/my-companies" style="background:#6A38C2;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">View watchlist</a>
      </p>
      <p style="color:#999;font-size:12px;margin-top:24px;">Instant watchlist alert · ${FRONTEND_URL}/alerts</p>
    </div>
  `;

  const text = `${companyName} posted ${jobs.length} new jobs. Visit ${FRONTEND_URL}/my-companies`;

  return { subject, html, text };
};
