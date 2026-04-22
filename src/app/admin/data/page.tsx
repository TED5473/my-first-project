import { AdminDataEditor } from "@/components/admin/admin-data-editor";

/**
 * Password-gated admin editor for trims. Client-side password gate with
 * sessionStorage persistence so the page stays unlocked across reloads
 * in the same tab. Writes go through /api/admin/trims/:id which is
 * protected by the same password (see src/lib/auth.ts).
 */
export default function AdminDataPage() {
  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Admin · Data editor
        </h1>
        <p className="text-muted-foreground mt-1">
          Inline-edit any trim. Changes persist to the database and update the
          live dashboard within seconds.
        </p>
      </div>
      <AdminDataEditor />
    </div>
  );
}
