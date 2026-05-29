export const siteConfig = {
  name: "Medine Huzur",
  description:
    "Medine Huzur’da seccade, tesbih, zikirmatik, hac ve umre ürünleri ile İslami hediyelikleri güvenle inceleyebilirsiniz.",
  url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  ogImage: "/images/og-image.jpg",
};

export function absoluteUrl(path = "") {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
}

export function buildSeoTitle(title?: string) {
  if (!title) {
    return "Medine Huzur | İslami Hediyelik, Seccade ve Tesbih";
  }

  return `${title} | Medine Huzur`;
}

export function buildSeoDescription(description?: string | null) {
  return (
    description?.trim() ||
    "Seccade, tesbih, zikirmatik, hac ve umre ürünleri ile İslami hediyelikleri Medine Huzur’da güvenle inceleyin."
  );
}