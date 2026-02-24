import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-svh flex-col bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-background">
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </div>
  );
}
