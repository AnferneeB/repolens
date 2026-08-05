import { Link } from "@heroui/react";

import { ErrorState } from "@/components/error-state";

export default function RepoNotFound() {
  return (
    <ErrorState
      description={
        <p>
          Repository not found, private, or mistyped. Example:{" "}
          <Link className="text-accent" href="/vercel/next.js">
            vercel/next.js
          </Link>
        </p>
      }
      homeLabel="Home"
      title="Repo not found"
    />
  );
}
