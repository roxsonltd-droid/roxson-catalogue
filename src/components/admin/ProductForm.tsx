"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/app/admin/actions";
import type { CategoryData, ProductData } from "@/lib/types";

type Props = {
  categories: CategoryData[];
  product: ProductData | null;
  action: (formData: FormData) => Promise<ActionResult>;
};

function Field({
  label,
  name,
  defaultValue = "",
  type = "text",
  required,
  full,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  full?: boolean;
  placeholder?: string;
}) {
  return (
    <div className={`form-field${full ? " full" : ""}`}>
      <label htmlFor={name}>{label}</label>
      {type === "textarea" ? (
        <textarea id={name} name={name} defaultValue={defaultValue} rows={3} placeholder={placeholder} />
      ) : (
        <input id={name} name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} step={type === "number" ? "any" : undefined} />
      )}
    </div>
  );
}

export function ProductForm({ categories, product, action }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(product?.imageUrl ?? null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await action(formData);
    if (result.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(result.error ?? "Something went wrong.");
      setPending(false);
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="form-status err">{error}</div>}

      <div className="admin-card">
        <h2>Basics</h2>
        <p className="admin-sub">Required fields marked with *.</p>
        <div className="form-grid">
          <Field label="ROXSON SKU *" name="sku" defaultValue={product?.sku} required />
          <Field label="Slug" name="slug" defaultValue={product?.slug} placeholder="Generated from SKU when empty" />
          <Field label="ARBO supplier code" name="supplierCode" defaultValue={product?.supplierCode ?? ""} />
          <div className="form-field">
            <label htmlFor="categoryId">Category *</label>
            <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? categories[0]?.id} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {String(c.num).padStart(2, "0")} — {c.titleEn}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="layout">Card layout</label>
            <select id="layout" name="layout" defaultValue={product?.layout ?? "ruler"}>
              <option value="ruler">Ruler (diameter + material)</option>
              <option value="layers">Layers (core / insulation / jacket)</option>
              <option value="table">Table (diameter / material / application / standard)</option>
            </select>
          </div>
          <Field label="Order" name="order" type="number" defaultValue={String(product?.order ?? "")} />
          <Field label="Unit" name="unit" defaultValue={product?.unit ?? "m"} />
          <Field label="MOQ" name="moq" type="number" defaultValue={product?.moq != null ? String(product.moq) : ""} />
          <Field label="Pack length" name="packLength" type="number" defaultValue={product?.packLength != null ? String(product.packLength) : ""} />
          <Field label="Datasheet URL" name="datasheetUrl" defaultValue={product?.datasheetUrl ?? ""} full />
          <Field label="Series (EN) *" name="seriesEn" defaultValue={product?.seriesEn} required />
          <Field label="Series (BG)" name="seriesBg" defaultValue={product?.seriesBg} />
          <Field label="Description (EN) *" name="descEn" defaultValue={product?.descEn} required type="textarea" full />
          <Field label="Description (BG)" name="descBg" defaultValue={product?.descBg} type="textarea" full />
        </div>
      </div>

      <div className="admin-card">
        <h2>Image</h2>
        <p className="admin-sub">
          Upload a photo (JPG/PNG/WebP, up to 10 MB). Stored on Cloudinary. Leave empty to keep the current image.
        </p>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" style={{ width: 160, height: 120, objectFit: "contain", border: "1px solid var(--line)", borderRadius: 6, marginBottom: 12, background: "#fff" }} />
        )}
        <div className="form-field">
          <label htmlFor="image">Image file</label>
          <input id="image" name="image" type="file" accept="image/*" onChange={onFileChange} />
        </div>
        {product?.imageUrl && <input type="hidden" name="currentImageUrl" value={product.imageUrl} />}
      </div>

      <div className="admin-card">
        <h2>Ruler / Material specs</h2>
        <p className="admin-sub">Used for the &ldquo;ruler&rdquo; and &ldquo;table&rdquo; card layouts.</p>
        <div className="form-grid">
          <Field label="Diameter min" name="diameterMin" type="number" defaultValue={product?.diameterMin != null ? String(product.diameterMin) : ""} />
          <Field label="Diameter max" name="diameterMax" type="number" defaultValue={product?.diameterMax != null ? String(product.diameterMax) : ""} />
          <div className="form-field">
            <label htmlFor="diameterUnit">Diameter unit</label>
            <select id="diameterUnit" name="diameterUnit" defaultValue={product?.diameterUnit ?? "INCH"}>
              <option value="INCH">Inches</option>
              <option value="MM">Millimetres</option>
            </select>
          </div>
          <Field label="Material (EN)" name="materialEn" defaultValue={product?.materialEn} />
          <Field label="Material (BG)" name="materialBg" defaultValue={product?.materialBg} />
        </div>
      </div>

      <div className="admin-card">
        <h2>Layers</h2>
        <p className="admin-sub">Used for the &ldquo;layers&rdquo; card layout.</p>
        <div className="form-grid">
          <Field label="Inner core (EN)" name="coreEn" defaultValue={product?.coreEn} />
          <Field label="Inner core (BG)" name="coreBg" defaultValue={product?.coreBg} />
          <Field label="Insulation (EN)" name="insulationEn" defaultValue={product?.insulationEn} />
          <Field label="Insulation (BG)" name="insulationBg" defaultValue={product?.insulationBg} />
          <Field label="Jacket (EN)" name="jacketEn" defaultValue={product?.jacketEn} />
          <Field label="Jacket (BG)" name="jacketBg" defaultValue={product?.jacketBg} />
        </div>
      </div>

      <div className="admin-card">
        <h2>Application / Standard</h2>
        <p className="admin-sub">Used for the &ldquo;table&rdquo; card layout.</p>
        <div className="form-grid">
          <Field label="Application (EN)" name="applicationEn" defaultValue={product?.applicationEn} />
          <Field label="Application (BG)" name="applicationBg" defaultValue={product?.applicationBg} />
          <Field label="Standard (EN)" name="standardEn" defaultValue={product?.standardEn} />
          <Field label="Standard (BG)" name="standardBg" defaultValue={product?.standardBg} />
          <div className="form-field full" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <input
              id="standardHighlight"
              name="standardHighlight"
              type="checkbox"
              defaultChecked={product?.standardHighlight}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="standardHighlight" style={{ margin: 0, textTransform: "none", letterSpacing: 0 }}>
              Highlight standard (green, e.g. compliance badge)
            </label>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="form-field full">
          <label htmlFor="technicalDataStatus">Technical data status</label>
          <select id="technicalDataStatus" name="technicalDataStatus" defaultValue={product?.technicalDataStatus ?? "UNREVIEWED"}>
            <option value="UNREVIEWED">Unreviewed</option>
            <option value="NEEDS_VERIFICATION">Needs verification</option>
            <option value="VERIFIED">Verified against source</option>
          </select>
        </div>
        <div className="form-field full" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <input id="isActive" name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} style={{ width: 16, height: 16 }} />
          <label htmlFor="isActive" style={{ margin: 0, textTransform: "none", letterSpacing: 0 }}>Active product</label>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save product"}
        </button>
        <Link className="btn" href="/admin" style={{ background: "#fff", border: "1px solid var(--line)" }}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
