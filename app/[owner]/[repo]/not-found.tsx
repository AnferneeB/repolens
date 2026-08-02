import { Link } from "@heroui/react";

import { ErrorState } from "@/components/error-state";

export default function RepoNotFound() {
  return (
    <ErrorState
      description={
        <p>
          We couldn&apos;t find that repository — maybe it&apos;s private, or
          the name is wrong? (e.g. try{" "}
          <Link className="text-accent" href="/vercel/next.js">
            vercel/next.js
          </Link>{" "}
          instead of vercel/nextjs.)
        </p>
      }
      homeLabel="Try another repo"
      title="Repo not found"
    />
  );
}
