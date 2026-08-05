"use client";

import { useState, startTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";

import {
  EXAMPLE_REPOS,
  exampleRepoKey,
  type ExampleRepo,
} from "@/lib/example-repos";
import { parseRepoInput } from "@/lib/parse-repo";

const STATIC_EXAMPLES: readonly ExampleRepo[] = EXAMPLE_REPOS.slice(0, 3);

export function RepoInput() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function goToRepo(owner: string, repo: string) {
    setError(null);
    startTransition(() => {
      router.push(`/${owner}/${repo}`);
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRepoInput(value);

    if (!parsed.ok) {
      setError(parsed.error);

      return;
    }

    goToRepo(parsed.owner, parsed.repo);
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <TextField
          fullWidth
          isInvalid={Boolean(error)}
          name="repo"
          value={value}
          onChange={setValue}
        >
          <Label>Public GitHub repo</Label>
          <Input className="w-full" placeholder="owner/repo or GitHub URL" />
          {error ? (
            <FieldError>{error}</FieldError>
          ) : (
            <Description>Only public repositories.</Description>
          )}
        </TextField>
        <Button fullWidth className="sm:w-auto" type="submit">
          View timeline
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2.5 sm:items-start">
        <p className="text-muted text-sm">Examples</p>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          {STATIC_EXAMPLES.map((example) => (
            <Button
              key={exampleRepoKey(example)}
              className="rounded-full border border-border/60 bg-surface-secondary/80 px-3 text-xs font-medium"
              size="sm"
              type="button"
              variant="secondary"
              onPress={() => goToRepo(example.owner, example.repo)}
            >
              {exampleRepoKey(example)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
