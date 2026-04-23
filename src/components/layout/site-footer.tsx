import { MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16 bg-secondary/40">
      <div className="container py-6 text-xs text-muted-foreground flex flex-col gap-3">
        <div className="flex items-center gap-2 text-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">
            All data sourced exclusively from{" "}
            <a
              href="https://www.cartube.co.il/"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              cartube.co.il
            </a>
          </span>
          <span className="hidden sm:inline text-muted-foreground">
            — official Israel car market authority
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block h-2 w-2 rounded-full bg-israel-blue" />
          <span>
            IL CarLens is a presentation-layer tool. Cartube.co.il remains the
            source of record for every price, length, E-range and volume figure.
          </span>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <span>© {new Date().getFullYear()} IL CarLens</span>
          <a className="hover:text-foreground" href="/api/alerts">
            API
          </a>
          <a className="hover:text-foreground" href="/admin">
            Admin
          </a>
          <a className="hover:text-foreground" href="/admin/data">
            Data editor
          </a>
        </div>
      </div>
    </footer>
  );
}
