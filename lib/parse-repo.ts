export type ParseRepoResult =
  | { ok: true; owner: string; repo: string }
  | { ok: false; error: string };

/**
 * Canonical owner/repo validation, shared by every path that can reach GitHub.
 *
 * These values are interpolated into the Octokit request path, and the URL
 * parser resolves `..` segments before the request is sent — so an owner of
 * `..` turns `/repos/../user` into `/user`, a different endpoint reached with
 * our token. Owners therefore follow GitHub's real login rules (alphanumeric
 * with interior hyphens, no dots), and repo names reject dots-only values.
 */
export const OWNER_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
export const REPO_PATTERN = /^(?!\.+$)[a-zA-Z0-9_.-]{1,100}$/;

export function isValidOwnerRepo(owner: string, repo: string): boolean {
  return OWNER_PATTERN.test(owner) && REPO_PATTERN.test(repo);
}

/**
 * Accepts `owner/repo` or a github.com URL and returns normalized parts.
 */
export function parseRepoInput(raw: string): ParseRepoResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      ok: false,
      error: "Paste a public GitHub repo URL or owner/repo.",
    };
  }

  let candidate = trimmed;

  try {
    if (trimmed.includes("://") || trimmed.startsWith("github.com/")) {
      const url = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      );

      const host = url.hostname.toLowerCase();

      if (host !== "github.com" && host !== "www.github.com") {
        return { ok: false, error: "Only github.com URLs are supported." };
      }

      const parts = url.pathname.split("/").filter(Boolean);

      if (parts.length < 2) {
        return {
          ok: false,
          error:
            "URL must include both owner and repo, e.g. github.com/vercel/next.js",
        };
      }

      candidate = `${parts[0]}/${parts[1].replace(/\.git$/, "")}`;
    }
  } catch {
    return {
      ok: false,
      error: "That doesn't look like a valid URL or owner/repo.",
    };
  }

  const [owner, repo, ...rest] = candidate.split("/");

  if (rest.length > 0 || !owner || !repo || !isValidOwnerRepo(owner, repo)) {
    return {
      ok: false,
      error: "Use the format owner/repo, e.g. vercel/next.js",
    };
  }

  return { ok: true, owner, repo };
}
