import { ErrorState } from "@/components/error-state";

export default function RootNotFound() {
  return (
    <ErrorState
      description={
        <p>
          That page doesn&apos;t exist. Head home and paste a public GitHub repo
          to see its timeline.
        </p>
      }
      homeLabel="Go home"
      title="Page not found"
    />
  );
}
