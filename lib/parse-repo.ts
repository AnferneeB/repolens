export type ParseRepoResult =
  | { ok: true; owner: string; repo: string }
  | { ok: false; error: string };

const OWNER_REPO = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

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

  if (!OWNER_REPO.test(candidate)) {
    return {
      ok: false,
      error: "Use the format owner/repo, e.g. vercel/next.js",
    };
  }

  const [owner, repo] = candidate.split("/");

  if (!owner || !repo || owner === "." || repo === ".") {
    return {
      ok: false,
      error: "Use the format owner/repo, e.g. vercel/next.js",
    };
  }

  return { ok: true, owner, repo };
}
