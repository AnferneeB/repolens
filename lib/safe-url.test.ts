import { describe, expect, test } from "bun:test";

import { safeGitHubAvatarUrl, safeGitHubPageUrl } from "./safe-url";

describe("safeGitHubPageUrl", () => {
  test("accepts github.com https links", () => {
    expect(safeGitHubPageUrl("https://github.com/vercel/next.js")).toBe(
      "https://github.com/vercel/next.js",
    );
    expect(
      safeGitHubPageUrl(
        "https://www.github.com/vercel/next.js/releases/tag/v1",
      ),
    ).toBe("https://www.github.com/vercel/next.js/releases/tag/v1");
  });

  test("rejects non-https and non-github hosts", () => {
    expect(safeGitHubPageUrl("javascript:alert(1)")).toBeUndefined();
    expect(
      safeGitHubPageUrl("http://github.com/vercel/next.js"),
    ).toBeUndefined();
    expect(safeGitHubPageUrl("https://evil.com/github.com")).toBeUndefined();
    expect(safeGitHubPageUrl("https://github.com.evil.dev/x")).toBeUndefined();
  });
});

describe("safeGitHubAvatarUrl", () => {
  test("accepts GitHub avatar CDN hosts", () => {
    expect(
      safeGitHubAvatarUrl("https://avatars.githubusercontent.com/u/1?v=4"),
    ).toBe("https://avatars.githubusercontent.com/u/1?v=4");
    expect(
      safeGitHubAvatarUrl(
        "https://raw.githubusercontent.com/org/repo/main/a.png",
      ),
    ).toBe("https://raw.githubusercontent.com/org/repo/main/a.png");
  });

  test("rejects other schemes and hosts", () => {
    expect(safeGitHubAvatarUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeGitHubAvatarUrl("https://evil.com/avatar.png")).toBeUndefined();
    expect(safeGitHubAvatarUrl("data:image/png;base64,abc")).toBeUndefined();
  });
});
