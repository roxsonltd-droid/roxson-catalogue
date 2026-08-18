import Link from "next/link";
import { prisma } from "@/lib/db";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { num: "asc" } }),
    prisma.product.findMany({ orderBy: { order: "asc" }, include: { category: true } }),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <>
      <h1>Products</h1>
      <p className="admin-sub">{products.length} products in the catalogue.</p>

      <div className="admin-toolbar">
        <Link className="btn btn-primary" href="/admin/new">
          + Add product
        </Link>
        <Link className="btn btn-secondary" href="/admin/new?category=1">
          + Quick add
        </Link>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Code</th>
              <th>Series</th>
              <th>Category</th>
              <th>Layout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const category = categoryById.get(p.categoryId);
              return (
                <tr key={p.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.sku} loading="lazy" />
                  </td>
                  <td className="mono" style={{ fontWeight: 600 }}>
                    {p.sku}{p.supplierCode ? ` · ARBO: ${p.supplierCode}` : ""}
                  </td>
                  <td>{p.seriesEn}</td>
                  <td>
                    {category ? `${String(category.num).padStart(2, "0")} — ${category.titleEn}` : p.categoryId}
                  </td>
                  <td>{p.layout}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Link href={`/admin/edit/${p.id}`}>Edit</Link>
                      <DeleteButton id={p.id} sku={p.sku} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--steel)", padding: 24 }}>
                  No products yet. Add your first product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
