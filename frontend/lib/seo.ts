import type { Metadata } from "next";

const DEFAULT_TITLE = "Medine Huzur | İslami Hediyelik, Seccade ve Tesbih";

export const siteConfig = {
  name: "Medine Huzur",
  description:
    "Medine Huzur’da seccade, tesbih, zikirmatik, hac ve umre ürünleri ile İslami hediyelikleri güvenle inceleyebilirsiniz.",
  url: "https://medinehuzur.com",
  ogImage: "/slides/slide-1-pc.jpg",
};

export function absoluteUrl(path = "/") {
  return new URL(path || "/", `${siteConfig.url}/`).toString();
}

export function buildSeoTitle(title?: string) {
  if (!title) {
    return DEFAULT_TITLE;
  }

  return `${title} | Medine Huzur`;
}

export function buildSeoDescription(description?: string | null) {
  return (
    description?.trim() ||
    "Seccade, tesbih, zikirmatik, hac ve umre ürünleri ile İslami hediyelikleri Medine Huzur’da güvenle inceleyin."
  );
}

export function createPageMetadata({
  title,
  description,
  path,
  image = siteConfig.ogImage,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const canonicalUrl = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const socialTitle = buildSeoTitle(title);

  return {
    title: path === "/" ? { absolute: socialTitle } : title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: "tr_TR",
      type: "website",
      images: [
        {
          url: imageUrl,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
