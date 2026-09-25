import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div>
        <p className="text-accent-ink text-sm font-medium">404</p>
        <h1 className="mt-1 text-2xl font-semibold">We couldn&apos;t find that</h1>
        <p className="text-muted mt-2 text-sm">It may have been deleted, or it belongs to someone else.</p>
        <LinkButton href="/dashboard" className="mt-6">
          Back to dashboard
        </LinkButton>
      </div>
    </main>
  );
}
