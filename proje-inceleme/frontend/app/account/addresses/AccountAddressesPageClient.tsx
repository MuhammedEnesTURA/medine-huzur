"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Home,
  Loader2,
  MapPin,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { apiUrl, authHeaders, readJsonOrThrow } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

type AddressDto = {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  isDefault: boolean;
  createdAtUtc: string;
};

type AddressForm = {
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  isDefault: boolean;
};

type Notice =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const emptyForm: AddressForm = {
  title: "",
  fullName: "",
  phone: "",
  city: "",
  district: "",
  addressLine: "",
  isDefault: false,
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AccountAddressesPageClient() {
  const { token, isReady, isAuthenticated } = useAuth();

  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const isEditing = Boolean(editingId);

  const loadAddresses = async () => {
    if (!token || !isAuthenticated) return;

    setIsLoading(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl("/api/account/addresses"), {
        headers: {
          ...authHeaders(token),
        },
        cache: "no-store",
      });

      const data = await readJsonOrThrow<AddressDto[]>(res);
      setAddresses(data);
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Adresler alınırken hata oluştu.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;

    void loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isAuthenticated]);

  const updateForm = (key: keyof AddressForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setNotice(null);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNotice(null);
  };

  const startEdit = (address: AddressDto) => {
    setEditingId(address.id);
    setForm({
      title: address.title,
      fullName: address.fullName,
      phone: address.phone,
      city: address.city,
      district: address.district,
      addressLine: address.addressLine,
      isDefault: address.isDefault,
    });
    setNotice(null);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Adres başlığı zorunludur.";
    if (!form.fullName.trim()) return "Ad soyad zorunludur.";
    if (!form.phone.trim()) return "Telefon zorunludur.";
    if (!form.city.trim()) return "İl zorunludur.";
    if (!form.district.trim()) return "İlçe zorunludur.";
    if (form.addressLine.trim().length < 10) {
      return "Açık adres en az 10 karakter olmalıdır.";
    }

    return null;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token || !isAuthenticated) return;

    const validationError = validateForm();

    if (validationError) {
      setNotice({
        type: "error",
        message: validationError,
      });
      return;
    }

    setIsSaving(true);
    setNotice(null);

    const payload = {
      title: form.title.trim(),
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      addressLine: form.addressLine.trim(),
      isDefault: form.isDefault,
    };

    try {
      const res = await fetch(
        apiUrl(
          isEditing
            ? `/api/account/addresses/${editingId}`
            : "/api/account/addresses"
        ),
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          body: JSON.stringify(payload),
        }
      );

      await readJsonOrThrow<AddressDto>(res);

      setNotice({
        type: "success",
        message: isEditing ? "Adres güncellendi." : "Adres eklendi.",
      });

      resetForm();
      await loadAddresses();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Adres kaydedilirken hata oluştu.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAddress = async (address: AddressDto) => {
    if (!token || !isAuthenticated) return;

    const confirmed = window.confirm(
      `"${address.title}" adresini silmek istediğine emin misin?`
    );

    if (!confirmed) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/account/addresses/${address.id}`), {
        method: "DELETE",
        headers: {
          ...authHeaders(token),
        },
      });

      if (!res.ok) {
        await readJsonOrThrow(res);
      }

      setNotice({
        type: "success",
        message: "Adres silindi.",
      });

      if (editingId === address.id) {
        resetForm();
      }

      await loadAddresses();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Adres silinirken hata oluştu.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const setDefaultAddress = async (address: AddressDto) => {
    if (!token || !isAuthenticated) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const res = await fetch(
        apiUrl(`/api/account/addresses/${address.id}/set-default`),
        {
          method: "POST",
          headers: {
            ...authHeaders(token),
          },
        }
      );

      await readJsonOrThrow<AddressDto>(res);

      setNotice({
        type: "success",
        message: "Varsayılan adres güncellendi.",
      });

      await loadAddresses();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Varsayılan adres güncellenemedi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isReady) {
    return (
      <main className="page-shell">
        <section className="page-container py-6">
          <div className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-mhgreen" />
            <p className="mt-3 text-sm font-bold text-muted">
              Oturum kontrol ediliyor...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="page-shell">
        <section className="page-container py-6">
          <div className="rounded-[1.35rem] border border-warning/25 bg-warning/10 p-8 text-center">
            <AlertTriangle className="mx-auto h-9 w-9 text-warning" />

            <h1 className="mt-4 text-2xl font-black text-foreground">
              Giriş yapman gerekiyor
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Adreslerini yönetmek için hesabına giriş yapmalısın.
            </p>

            <Link
              href="/login?redirectTo=/account/addresses"
              className="btn-premium mt-5 min-h-10 text-sm"
            >
              Giriş Yap
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-container py-5 md:py-6">
        <Link
          href="/account/orders"
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border-soft bg-panel/70 px-3 text-sm font-bold text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Siparişlerime dön
        </Link>

        <div className="mt-5 mb-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-mhgreen">
            Hesabım
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-foreground md:text-3xl">
            Adreslerim
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Teslimat adreslerini ekleyebilir, düzenleyebilir ve varsayılan adres
            seçebilirsin.
          </p>
        </div>

        {notice && (
          <div
            className={`mb-5 flex gap-3 rounded-2xl border p-3 text-sm font-bold ${
              notice.type === "success"
                ? "border-mhgreen/30 bg-mhgreen/10 text-mhgreen"
                : "border-danger/30 bg-danger/10 text-danger"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <span>{notice.message}</span>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5 xl:sticky xl:top-24 xl:self-start">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Edit3 className="h-5 w-5 text-mhgreen" />
              ) : (
                <Plus className="h-5 w-5 text-mhgreen" />
              )}

              <h2 className="text-xl font-black text-foreground">
                {isEditing ? "Adresi düzenle" : "Yeni adres ekle"}
              </h2>
            </div>

            <form onSubmit={onSubmit} className="mt-5 grid gap-3">
              <label>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                  Adres başlığı
                </span>
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  className="input-premium mt-2 min-h-10 text-sm"
                  placeholder="Ev, İş, Annem..."
                />
              </label>

              <label>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                  Ad soyad
                </span>
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    updateForm("fullName", event.target.value)
                  }
                  className="input-premium mt-2 min-h-10 text-sm"
                  placeholder="Ad Soyad"
                />
              </label>

              <label>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                  Telefon
                </span>
                <input
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  className="input-premium mt-2 min-h-10 text-sm"
                  placeholder="05xx xxx xx xx"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    İl
                  </span>
                  <input
                    value={form.city}
                    onChange={(event) => updateForm("city", event.target.value)}
                    className="input-premium mt-2 min-h-10 text-sm"
                    placeholder="İstanbul"
                  />
                </label>

                <label>
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                    İlçe
                  </span>
                  <input
                    value={form.district}
                    onChange={(event) =>
                      updateForm("district", event.target.value)
                    }
                    className="input-premium mt-2 min-h-10 text-sm"
                    placeholder="Üsküdar"
                  />
                </label>
              </div>

              <label>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-2">
                  Açık adres
                </span>
                <textarea
                  value={form.addressLine}
                  onChange={(event) =>
                    updateForm("addressLine", event.target.value)
                  }
                  className="input-premium mt-2 min-h-24 resize-none py-3 text-sm"
                  placeholder="Mahalle, cadde, sokak, bina, daire..."
                />
              </label>

              <label className="flex cursor-pointer gap-3 rounded-2xl border border-border-soft bg-panel/65 p-3 transition hover:border-border-strong">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    updateForm("isDefault", event.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-mhgreen"
                />

                <span className="text-sm leading-6 text-muted">
                  Bu adresi varsayılan teslimat adresim yap.
                </span>
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-mhgreen px-4 text-sm font-black text-white transition hover:bg-mhgreen-dark disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Kaydediliyor
                    </>
                  ) : isEditing ? (
                    "Adresi Güncelle"
                  ) : (
                    "Adresi Ekle"
                  )}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-panel/70 px-4 text-sm font-black text-foreground transition hover:bg-panel-3"
                  >
                    <X className="h-4 w-4" />
                    Vazgeç
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-[1.35rem] border border-border-soft bg-panel/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-foreground">
                  Kayıtlı adresler
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {addresses.length} adres kayıtlı
                </p>
              </div>

              <Home className="h-6 w-6 text-mhgreen" />
            </div>

            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-mhgreen" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-2xl border border-border-soft bg-panel/65 p-8 text-center">
                <MapPin className="mx-auto h-10 w-10 text-mhgreen" />

                <h3 className="mt-4 text-xl font-black text-foreground">
                  Henüz adres yok
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                  İlk teslimat adresini ekleyerek checkout adımını daha hızlı
                  kullanabilirsin.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {addresses.map((address) => (
                  <article
                    key={address.id}
                    className={`rounded-2xl border p-4 transition hover:border-border-strong ${
                      address.isDefault
                        ? "border-mhgreen/35 bg-mhgreen/10"
                        : "border-border-soft bg-panel/65"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-foreground">
                            {address.title}
                          </h3>

                          {address.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-mhgreen/30 bg-mhgreen/10 px-2 py-1 text-[11px] font-black text-mhgreen">
                              <Star className="h-3 w-3" />
                              Varsayılan
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm font-bold text-foreground">
                          {address.fullName}
                        </p>

                        <p className="mt-1 text-sm text-muted">
                          {address.phone}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-foreground">
                          {address.addressLine}
                        </p>

                        <p className="mt-1 text-sm font-bold text-muted">
                          {address.district} / {address.city}
                        </p>

                        <p className="mt-2 text-xs text-muted-2">
                          Eklenme: {formatDate(address.createdAtUtc)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                        {!address.isDefault && (
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => setDefaultAddress(address)}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-mhgreen/30 bg-mhgreen/10 px-3 text-xs font-black text-mhgreen transition hover:bg-mhgreen/15 disabled:opacity-50"
                          >
                            <Star className="h-3.5 w-3.5" />
                            Varsayılan Yap
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => startEdit(address)}
                          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-border-soft bg-panel/70 px-3 text-xs font-black text-foreground transition hover:bg-panel-3"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Düzenle
                        </button>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => deleteAddress(address)}
                          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 text-xs font-black text-danger transition hover:bg-danger/15 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Sil
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}