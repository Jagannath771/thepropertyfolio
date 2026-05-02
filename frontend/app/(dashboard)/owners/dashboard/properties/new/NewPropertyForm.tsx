"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  UploadCloud,
  X,
  Loader2,
  CheckCircle2,
  Plus,
} from "lucide-react";

import {
  createProperty,
  uploadPropertyImage,
  type CreatePropertyInput,
} from "@/lib/owner-properties";

const PROPERTY_TYPES = ["house", "apartment", "condo", "townhome", "commercial"] as const;
const PET_POLICIES = [
  { value: "any", label: "Any pets welcome" },
  { value: "cats_only", label: "Cats only" },
  { value: "dogs_only", label: "Dogs only" },
  { value: "small_pets", label: "Small pets only" },
  { value: "no_pets", label: "No pets" },
];
const AMENITIES = [
  "Pool",
  "Gym",
  "Parking",
  "Garden",
  "Balcony",
  "Fireplace",
  "Washer/Dryer",
  "Furnished",
  "Concierge",
  "Rooftop",
  "EV Charging",
  "Bike Storage",
];

interface FieldErrors {
  [key: string]: string | undefined;
}

interface FormState {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  monthly_rent: string;
  deposit: string;
  available_date: string;
  amenities: string[];
  pet_policy: string;
}

const INITIAL: FormState = {
  title: "",
  description: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  property_type: "apartment",
  bedrooms: "",
  bathrooms: "",
  square_feet: "",
  monthly_rent: "",
  deposit: "",
  available_date: "",
  amenities: [],
  pet_policy: "any",
};

function parseNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function validate(state: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!state.title.trim()) errors.title = "Title is required.";
  if (state.title.trim().length > 255) errors.title = "Title is too long (max 255).";
  if (!state.address.trim()) errors.address = "Street address is required.";
  if (state.monthly_rent && parseNumber(state.monthly_rent) === null) {
    errors.monthly_rent = "Enter a valid monthly rent amount.";
  }
  if (state.bedrooms && parseNumber(state.bedrooms) === null) {
    errors.bedrooms = "Bedrooms must be a number.";
  }
  if (state.bathrooms && parseNumber(state.bathrooms) === null) {
    errors.bathrooms = "Bathrooms must be a number.";
  }
  if (state.square_feet && parseNumber(state.square_feet) === null) {
    errors.square_feet = "Square footage must be a number.";
  }
  if (state.available_date && !/^\d{4}-\d{2}-\d{2}$/.test(state.available_date)) {
    errors.available_date = "Use YYYY-MM-DD.";
  }
  return errors;
}

export default function NewPropertyForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<FormState>(INITIAL);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    done: number;
  } | null>(null);

  const previews = useMemo(
    () => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [files],
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const toggleAmenity = useCallback((a: string) => {
    setState((s) => ({
      ...s,
      amenities: s.amenities.includes(a)
        ? s.amenities.filter((x) => x !== a)
        : [...s.amenities, a],
    }));
  }, []);

  const onFilesPicked = (picked: FileList | null) => {
    if (!picked) return;
    const incoming = Array.from(picked).filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image and was skipped.`);
        return false;
      }
      if (f.size > 8 * 1024 * 1024) {
        toast.error(`${f.name} is larger than 8 MB and was skipped.`);
        return false;
      }
      return true;
    });
    setFiles((current) => [...current, ...incoming].slice(0, 10));
  };

  const removeFile = (idx: number) => {
    setFiles((current) => current.filter((_, i) => i !== idx));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate(state);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreatePropertyInput = {
        title: state.title.trim(),
        description: state.description.trim() || null,
        address: state.address.trim(),
        city: state.city.trim() || null,
        state: state.state.trim() || null,
        zip_code: state.zip_code.trim() || null,
        property_type: state.property_type || null,
        bedrooms: parseNumber(state.bedrooms),
        bathrooms: parseNumber(state.bathrooms),
        square_feet: parseNumber(state.square_feet),
        monthly_rent: parseNumber(state.monthly_rent),
        deposit: parseNumber(state.deposit),
        available_date: state.available_date || null,
        amenities: state.amenities,
        pet_policy: state.pet_policy || null,
        is_featured: false,
      };

      const property = await createProperty(payload);

      if (files.length > 0) {
        setUploadProgress({ total: files.length, done: 0 });
        // Upload sequentially so we can display per-file progress and not
        // overwhelm weak owner networks.
        for (const file of files) {
          try {
            await uploadPropertyImage(property.id, file);
            setUploadProgress((p) => (p ? { ...p, done: p.done + 1 } : null));
          } catch (err) {
            toast.error(
              `Failed to upload ${file.name}: ${(err as Error).message}. You can re-upload from the property detail page.`,
            );
          }
        }
        setUploadProgress(null);
      }

      toast.success("Property created.");
      router.push("/owners/dashboard");
      router.refresh();
    } catch (err) {
      const msg = (err as Error).message || "Something went wrong.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/owners/dashboard"
          className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-foreground mb-2"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            List a New Property
          </h1>
          <p className="text-foreground-secondary text-sm">
            Fill in the details below. You can edit or archive this listing at any time.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-8" data-testid="new-property-form">
          {/* Basics */}
          <section className="glass-card p-6 space-y-5">
            <h2 className="font-semibold text-foreground">Basics</h2>

            <div>
              <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                Listing title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="input-glass w-full"
                value={state.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Sunny 2-bed near downtown"
                required
                maxLength={255}
                aria-invalid={!!errors.title}
                data-testid="field-title"
              />
              {errors.title && (
                <p className="text-xs text-danger mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                Description
              </label>
              <textarea
                className="input-glass w-full min-h-28"
                value={state.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Describe the property, neighborhood, and what makes it special."
              />
            </div>

            <div>
              <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                Property type
              </label>
              <select
                className="input-glass w-full"
                value={state.property_type}
                onChange={(e) => setField("property_type", e.target.value)}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Address */}
          <section className="glass-card p-6 space-y-5">
            <h2 className="font-semibold text-foreground">Address</h2>

            <div>
              <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                Street address <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="input-glass w-full"
                value={state.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="400 Market St"
                required
                aria-invalid={!!errors.address}
                data-testid="field-address"
              />
              {errors.address && (
                <p className="text-xs text-danger mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  className="input-glass w-full"
                  value={state.city}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  className="input-glass w-full"
                  value={state.state}
                  onChange={(e) => setField("state", e.target.value)}
                  placeholder="CA"
                  maxLength={50}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                ZIP / Postal code
              </label>
              <input
                type="text"
                className="input-glass w-full"
                value={state.zip_code}
                onChange={(e) => setField("zip_code", e.target.value)}
                placeholder="94103"
              />
            </div>
          </section>

          {/* Specs + pricing */}
          <section className="glass-card p-6 space-y-5">
            <h2 className="font-semibold text-foreground">Size, pricing & availability</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                  Bedrooms
                </label>
                <input
                  type="number"
                  min={0}
                  className="input-glass w-full"
                  value={state.bedrooms}
                  onChange={(e) => setField("bedrooms", e.target.value)}
                  aria-invalid={!!errors.bedrooms}
                />
                {errors.bedrooms && <p className="text-xs text-danger mt-1">{errors.bedrooms}</p>}
              </div>
              <div>
                <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                  Bathrooms
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className="input-glass w-full"
                  value={state.bathrooms}
                  onChange={(e) => setField("bathrooms", e.target.value)}
                  aria-invalid={!!errors.bathrooms}
                />
                {errors.bathrooms && (
                  <p className="text-xs text-danger mt-1">{errors.bathrooms}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                  Square feet
                </label>
                <input
                  type="number"
                  min={0}
                  className="input-glass w-full"
                  value={state.square_feet}
                  onChange={(e) => setField("square_feet", e.target.value)}
                  aria-invalid={!!errors.square_feet}
                />
              </div>
              <div>
                <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                  Available date
                </label>
                <input
                  type="date"
                  className="input-glass w-full"
                  value={state.available_date}
                  onChange={(e) => setField("available_date", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                  Monthly rent (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  className="input-glass w-full"
                  value={state.monthly_rent}
                  onChange={(e) => setField("monthly_rent", e.target.value)}
                  placeholder="2400"
                  aria-invalid={!!errors.monthly_rent}
                  data-testid="field-monthly-rent"
                />
              </div>
              <div>
                <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                  Security deposit (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  className="input-glass w-full"
                  value={state.deposit}
                  onChange={(e) => setField("deposit", e.target.value)}
                  placeholder="3600"
                />
              </div>
            </div>
          </section>

          {/* Amenities + pets */}
          <section className="glass-card p-6 space-y-5">
            <h2 className="font-semibold text-foreground">Amenities & policies</h2>

            <div>
              <label className="text-xs text-foreground-muted uppercase block mb-2">
                Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => {
                  const on = state.amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        on
                          ? "bg-primary text-white border-primary"
                          : "text-foreground-secondary border-white/10 hover:bg-white/5"
                      }`}
                    >
                      {on ? <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> : null}
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-foreground-muted uppercase block mb-1.5">
                Pet policy
              </label>
              <select
                className="input-glass w-full sm:w-1/2"
                value={state.pet_policy}
                onChange={(e) => setField("pet_policy", e.target.value)}
              >
                {PET_POLICIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Images */}
          <section className="glass-card p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Photos</h2>
                <p className="text-xs text-foreground-muted mt-1">
                  JPG, PNG, or WebP up to 8 MB. Maximum 10 photos.
                </p>
              </div>
            </div>

            <div
              className="rounded-xl border-2 border-dashed border-white/10 p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFilesPicked(e.dataTransfer.files);
              }}
              data-testid="upload-dropzone"
            >
              <UploadCloud className="w-8 h-8 text-foreground-muted mx-auto mb-3" />
              <p className="text-sm text-foreground">
                Drop images here, or{" "}
                <span className="text-primary font-medium">browse</span>
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => onFilesPicked(e.target.files)}
              data-testid="file-input"
            />

            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {previews.map((p, i) => (
                  <div
                    key={p.url}
                    className="relative aspect-square rounded-lg overflow-hidden border border-white/10"
                  >
                    <img
                      src={p.url}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-black/80"
                      aria-label={`Remove ${p.file.name}`}
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex items-center justify-between gap-3">
            <Link href="/owners/dashboard" className="btn-outline px-5">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-6"
              data-testid="submit-new-property"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress
                    ? `Uploading photos (${uploadProgress.done}/${uploadProgress.total})…`
                    : "Publishing…"}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Publish listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
