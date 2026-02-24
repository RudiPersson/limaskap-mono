import NavUser from "@/components/nav-user";
import { protocol, rootDomain } from "@/lib/utils";

export default function SiteHeader() {
  return (
    <header className="flex items-center bg-background sticky top-0 z-50 w-full px-4 h-12 border-b border-border">
      {/* <Link href="/">
        <span className="font-black text-foreground text-lg">Limaskap</span>
      </Link> */}
      <a href={`${protocol}://${rootDomain}`}>
        <span className="font-black text-foreground text-lg">Limaskap Mono</span>
      </a>
      <div className="ml-auto flex items-center gap-2">
        <NavUser />
      </div>
    </header>
  );
}
