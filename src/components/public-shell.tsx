import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PublicShell({
  children,
  headerExtra,
}: {
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader>{headerExtra}</SiteHeader>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
