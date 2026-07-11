/**
 * Trigger the priority Puppeteer GitHub Actions workflow via repository_dispatch.
 * Requires GITHUB_WORKFLOW_DISPATCH_TOKEN (PAT with repo scope) and GITHUB_REPO (owner/name).
 */
export const dispatchPuppeteerPriorityWorkflow = async () => {
  const token = process.env.GITHUB_WORKFLOW_DISPATCH_TOKEN;
  const repo = process.env.GITHUB_REPO;

  if (!token || !repo) {
    console.log(
      "[GitHub] Skipping priority Puppeteer dispatch (GITHUB_WORKFLOW_DISPATCH_TOKEN or GITHUB_REPO not set)",
    );
    return { dispatched: false, reason: "missing_config" };
  }

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    console.warn("[GitHub] Invalid GITHUB_REPO — expected owner/name");
    return { dispatched: false, reason: "invalid_repo" };
  }

  const url = `https://api.github.com/repos/${owner}/${repoName}/dispatches`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        event_type: "puppeteer-priority-sync",
        client_payload: { triggered_at: new Date().toISOString() },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(
        `[GitHub] repository_dispatch failed (${response.status}): ${body.slice(0, 200)}`,
      );
      return { dispatched: false, reason: "api_error", status: response.status };
    }

    console.log("[GitHub] Priority Puppeteer workflow dispatched");
    return { dispatched: true };
  } catch (error) {
    console.warn("[GitHub] repository_dispatch error:", error.message);
    return { dispatched: false, reason: error.message };
  }
};
