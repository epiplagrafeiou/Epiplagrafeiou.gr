
// This file is no longer needed as the admin layout is now handled by the root Providers component.
// Keeping it simple to avoid nested layouts.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
