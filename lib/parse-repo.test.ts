import { describe, expect, test } from "bun:test";

import { isValidOwnerRepo, parseRepoInput } from "./parse-repo";

function expectOk(input: string, owner: string, repo: string) {
  const result = parseRepoInput(input);

  expect(result.ok).toBe(true);

  if (result.ok) {
    expect(result.owner).toBe(owner);
    expect(result.repo).toBe(repo);
  }
}

describe("parseRepoInput", () => {
  test("accepts owner/repo", () => {
    expectOk("vercel/next.js", "vercel", "next.js");
  });

  test("trims whitespace", () => {
    expectOk("  facebook/react  ", "facebook", "react");
  });

  test("accepts full https URL", () => {
    expectOk("https://github.com/vercel/next.js", "vercel", "next.js");
  });

  test("accepts github.com URL without protocol", () => {
    expectOk("github.com/facebook/react", "facebook", "react");
  });

  test("accepts www.github.com URLs", () => {
    expectOk("https://www.github.com/vercel/next.js", "vercel", "next.js");
  });

  test("strips .git suffix from URLs", () => {
    expectOk("https://github.com/vercel/next.js.git", "vercel", "next.js");
  });

  test("ignores extra URL path segments (tree/branch)", () => {
    expectOk(
      "https://github.com/vercel/next.js/tree/canary/packages",
      "vercel",
      "next.js",
    );
  });

  test("rejects non-github hosts", () => {
    const result = parseRepoInput("https://gitlab.com/foo/bar");

    expect(result.ok).toBe(false);
  });

  test("rejects lookalike hosts", () => {
    expect(parseRepoInput("https://evilgithub.com/foo/bar").ok).toBe(false);
    expect(parseRepoInput("https://github.com.evil.dev/foo/bar").ok).toBe(
      false,
    );
  });

  test("rejects github.com subdomains other than www", () => {
    expect(parseRepoInput("https://gist.github.com/foo/bar").ok).toBe(false);
    expect(parseRepoInput("https://raw.github.com/foo/bar").ok).toBe(false);
  });

  test("rejects empty input", () => {
    const result = parseRepoInput("   ");

    expect(result.ok).toBe(false);
  });

  test("rejects owner-only URL", () => {
    const result = parseRepoInput("https://github.com/vercel");

    expect(result.ok).toBe(false);
  });

  test("rejects bare word without slash", () => {
    const result = parseRepoInput("nextjs");

    expect(result.ok).toBe(false);
  });

  test("rejects invalid characters", () => {
    const result = parseRepoInput("owner/repo with spaces");

    expect(result.ok).toBe(false);
  });

  test("rejects dot-only segments", () => {
    const result = parseRepoInput("./.");

    expect(result.ok).toBe(false);
  });

  // `..` would survive into the Octokit request path, where the URL parser
  // resolves it and rewrites `/repos/../user` to the `/user` endpoint.
  test("rejects traversal segments", () => {
    expect(parseRepoInput("../user").ok).toBe(false);
    expect(parseRepoInput("../..").ok).toBe(false);
    expect(parseRepoInput("https://github.com/../user").ok).toBe(false);
    expect(isValidOwnerRepo("..", "user")).toBe(false);
    expect(isValidOwnerRepo("vercel", "..")).toBe(false);
  });

  test("rejects owners with characters GitHub logins disallow", () => {
    expect(isValidOwnerRepo("own.er", "repo")).toBe(false);
    expect(isValidOwnerRepo("-owner", "repo")).toBe(false);
    expect(isValidOwnerRepo("owner-", "repo")).toBe(false);
    expect(isValidOwnerRepo("a".repeat(40), "repo")).toBe(false);
  });

  test("still accepts real-world owners and repos", () => {
    expect(isValidOwnerRepo("a", "b")).toBe(true);
    expect(isValidOwnerRepo("home-assistant", "core")).toBe(true);
    expect(isValidOwnerRepo("vercel", "next.js")).toBe(true);
    expect(isValidOwnerRepo("owner", "some_repo.name-v2")).toBe(true);
  });
});
