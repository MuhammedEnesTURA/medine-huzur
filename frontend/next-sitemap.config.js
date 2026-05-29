const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.medinehuzur.com";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5096";

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  sitemapSize: 5000,

  exclude: [
    "/admin",
    "/admin/*",
    "/account",
    "/account/*",
    "/checkout",
    "/cart",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/confirm-email",
    "/guest-orders",
    "/order-success",
    "/payment/mock",
    "/payment/success",
    "/payment/failure",
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/account",
          "/account/*",
          "/checkout",
          "/cart",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/confirm-email",
          "/guest-orders",
          "/order-success",
          "/payment/mock",
          "/payment/success",
          "/payment/failure",
        ],
      },
    ],
  },

  transform: async (config, path) => {
    let priority = 0.7;
    let changefreq = "weekly";

    if (path === "/") {
      priority = 1.0;
      changefreq = "daily";
    } else if (path === "/products") {
      priority = 0.9;
      changefreq = "daily";
    } else if (path.startsWith("/product/")) {
      priority = 0.95;
      changefreq = "weekly";
    } else if (path === "/contact") {
      priority = 0.6;
      changefreq = "monthly";
    } else if (path.startsWith("/legal")) {
      priority = 0.3;
      changefreq = "monthly";
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },

  additionalPaths: async (config) => {
    try {
      console.log(`[next-sitemap] Ürünler çekiliyor: ${apiBaseUrl}/api/catalog/products`);

      const response = await fetch(`${apiBaseUrl}/api/catalog/products?page=1&pageSize=500`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.warn(
          `[next-sitemap] Ürün endpointi başarısız: ${response.status} ${response.statusText}`
        );
        return [];
      }

      const data = await response.json();
      const products = Array.isArray(data?.items) ? data.items : [];

      console.log(`[next-sitemap] Sitemap'e eklenecek ürün sayısı: ${products.length}`);

      return Promise.all(
        products
          .filter((product) => product && typeof product.slug === "string")
          .filter((product) => product.slug.trim().length > 0)
          .map((product) =>
            config.transform(config, `/product/${product.slug.trim()}`)
          )
      );
    } catch (error) {
      console.warn("[next-sitemap] Ürünler sitemap'e eklenemedi.");
      console.warn(error);
      return [];
    }
  },
};