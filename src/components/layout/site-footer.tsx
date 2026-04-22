export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16 bg-secondary/40">
      <div className="container py-8 text-xs text-muted-foreground flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-israel-blue" />
          <span>
            IL CarLens · Data via Israel Vehicle Importers Association (I-VIA) & importer websites
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>© {new Date().getFullYear()} IL CarLens</span>
          <a className="hover:text-foreground" href="/api/alerts">
            API
          </a>
          <a className="hover:text-foreground" href="/admin">
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
}
