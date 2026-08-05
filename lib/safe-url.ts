/**
 * Harden URLs that flow from GitHub into `<a href>` / `<img src>`.
 * React warns on `javascript:` but does not block it; these helpers refuse
 * anything that is not the expected HTTPS host.
 */

function parseHttps(raw: string): URL | null {
  try {
    const url = new URL(raw);

    if (url.protocol !== "https:") {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

/** Links to github.com pages (repo, commit, release, …). */
export function safeGitHubPageUrl(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) {
    return undefined;
  }

  const url = parseHttps(raw);

  if (!url) {
    return undefined;
  }

  const host = url.hostname.toLowerCase();

  if (host !== "github.com" && host !== "www.github.com") {
    return undefined;
  }

  return url.href;
}

/** Avatar images from GitHub's CDN. */
export function safeGitHubAvatarUrl(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) {
    return undefined;
  }

  const url = parseHttps(raw);

  if (!url) {
    return undefined;
  }

  const host = url.hostname.toLowerCase();

  if (
    host !== "avatars.githubusercontent.com" &&
    !host.endsWith(".githubusercontent.com")
  ) {
    return undefined;
  }

  return url.href;
}
