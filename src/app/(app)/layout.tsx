import { UserButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { BottomNav, SideNav } from "@/components/layout/nav";
import { RealtimeRefresh } from "@/components/layout/realtime-refresh";
import { TimezoneSync } from "@/components/layout/timezone-sync";
import { DemoBanner } from "@/components/layout/demo-banner";
import { getAuthMode } from "@/lib/auth-mode";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isDemo = getAuthMode() === "demo";
  return (
    <div className="flex min-h-screen">
      <aside className="border-line bg-surface sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r p-4 lg:flex">
        <div className="mb-8 px-2">
          <Logo href="/dashboard" />
        </div>
        <SideNav />
        <div className="mt-auto px-2">{isDemo ? null : <RealtimeRefresh />}</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {isDemo ? <DemoBanner /> : null}
        <header className="border-line bg-page/90 sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b px-4 backdrop-blur sm:px-6">
          <div className="lg:hidden">
            <Logo href="/dashboard" />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <LinkButton href="/items/new" size="sm">
              <Plus className="size-4" aria-hidden />
              <span className="hidden sm:inline">Add item</span>
            </LinkButton>
            {isDemo ? (
              <span className="bg-warning/20 text-ink rounded-full px-2.5 py-1 text-xs font-medium">Demo</span>
            ) : (
              <UserButton />
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 sm:px-6 lg:pb-10">{children}</main>
      </div>
      <BottomNav />
      <TimezoneSync />
    </div>
  );
}
