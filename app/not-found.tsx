import { ErrorState } from "@/components/error-state";

export default function RootNotFound() {
  return (
    <ErrorState
      description={<p>That page doesn&apos;t exist.</p>}
      homeLabel="Home"
      title="Page not found"
    />
  );
}
