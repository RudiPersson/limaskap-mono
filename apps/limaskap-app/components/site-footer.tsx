import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SiteFooter() {
  return (
    <footer className="bg-background border-t border-border px-4 py-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        {/* Logo */}
        <Link href="/" className="group">
          <span className="font-black text-foreground text-lg group-hover:text-muted-foreground transition-colors">
            Limaskap
          </span>
        </Link>
        
        {/* Theme Toggle */}
        <div className="flex items-center space-x-2">
          <ThemeToggle />
        </div>
        
        {/* Copyright */}
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Limaskap. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
