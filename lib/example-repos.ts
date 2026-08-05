export type ExampleRepo = {
  owner: string;
  repo: string;
};

/** Curated popular public repos for homepage suggestions — no network. */
export const EXAMPLE_REPOS: readonly ExampleRepo[] = [
  { owner: "vercel", repo: "next.js" },
  { owner: "facebook", repo: "react" },
  { owner: "home-assistant", repo: "core" },
  { owner: "microsoft", repo: "vscode" },
  { owner: "torvalds", repo: "linux" },
  { owner: "kubernetes", repo: "kubernetes" },
  { owner: "django", repo: "django" },
  { owner: "rust-lang", repo: "rust" },
  { owner: "golang", repo: "go" },
  { owner: "nodejs", repo: "node" },
  { owner: "vuejs", repo: "core" },
  { owner: "tensorflow", repo: "tensorflow" },
  { owner: "ansible", repo: "ansible" },
  { owner: "obsidianmd", repo: "obsidian-releases" },
  { owner: "denoland", repo: "deno" },
] as const;

export function exampleRepoKey(example: ExampleRepo): string {
  return `${example.owner}/${example.repo}`;
}
