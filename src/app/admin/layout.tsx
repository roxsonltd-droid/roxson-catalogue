import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="admin-shell">
      <div className="admin-bar">
        <div className="wrap">
          <Link href="/admin" className="brand">
            <span className="brand-word">
              <span className="name">ROXSON LTD · Admin</span>
            </span>
          </Link>
          <div className="admin-actions">
            <Link href="/admin/inquiries">Inquiries</Link>
            <Link href="/admin">Products</Link>
            <Link href="/" target="_blank" rel="noreferrer">
              View site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
      <main className="admin-main">
        <div className="wrap">{children}</div>
      </main>
    </div>
  );
}
