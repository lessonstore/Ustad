import { Link } from "@tanstack/react-router";
import { BookOpen, Coins, GraduationCap, Home, LogIn, Tag, UserRound } from "lucide-react";
import { useAccount } from "@/hooks/use-account";
import type { ReactNode } from "react";
import { HeaderSubtitle } from "@/components/HeaderSubtitle";

const top = "rounded-lg px-3 py-2 hover:bg-secondary";
const bottom = "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold text-muted-foreground transition-colors";
const bottomActive = { className: "text-primary" };

export function Shell({ children }: { children: ReactNode }) {
  const { user, wallet } = useAccount();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-2.5 md:max-w-[360px]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block font-display text-xl font-semibold">USTAD</span>
              <HeaderSubtitle />
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            <Link to="/" className={top} activeOptions={{ exact: true }} activeProps={{ className: "bg-secondary" }}>Home</Link>
            <Link to="/classes" className={top} activeProps={{ className: "bg-secondary" }}>Classes</Link>
            <Link to="/pricing" className={top} activeProps={{ className: "bg-secondary" }}>Plans</Link>
            {user ? (
              <Link to="/profile" className="ml-1 inline-flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-primary">
                <Coins className="h-4 w-4" /><b>{wallet?.tokens ?? 0}</b><span className="text-xs">tokens</span><UserRound className="ml-1 h-4 w-4" />
              </Link>
            ) : (
              <Link to="/auth" className="ml-1 rounded-xl bg-gradient-primary px-4 py-2 text-primary-foreground">Sign in</Link>
            )}
          </nav>
          {user ? (
            <Link to="/profile" title="Your token balance" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-sm text-primary md:hidden">
              <Coins className="h-4 w-4" /><b>{wallet?.tokens ?? 0}</b><span className="text-xs">tokens</span>
            </Link>
          ) : (
            <Link to="/pricing" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-primary md:hidden">
              <Coins className="h-4 w-4" />Get tokens
            </Link>
          )}
        </div>
      </header>
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <footer className="border-t border-border/60 py-8 pb-24 text-center text-sm text-muted-foreground md:pb-8">
        USTAD · Built for teachers of School Education Department, Punjab
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <Link to="/" className={bottom} activeOptions={{ exact: true }} activeProps={bottomActive}><Home className="h-5 w-5" />Home</Link>
        <Link to="/classes" className={bottom} activeProps={bottomActive}><BookOpen className="h-5 w-5" />Classes</Link>
        <Link to="/pricing" className={bottom} activeProps={bottomActive}><Tag className="h-5 w-5" />Plans</Link>
        {user ? (
          <Link to="/profile" className={bottom} activeProps={bottomActive}><UserRound className="h-5 w-5" />Profile</Link>
        ) : (
          <Link to="/auth" className={bottom} activeProps={bottomActive}><LogIn className="h-5 w-5" />Sign in</Link>
        )}
      </nav>
    </div>
  );
}
