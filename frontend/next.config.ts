import type { NextConfig } from "next";

const noindexHeaders = [
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  },
];

const privateRouteSources = [
  "/admin/:path*",
  "/account/:path*",
  "/cart",
  "/checkout",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/confirm-email",
  "/guest-orders",
  "/order-success",
  "/payment/:path*",
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5096",
        pathname: "/uploads/**",
      },
    ],
  },
  async headers() {
    const headers = privateRouteSources.map((source) => ({
      source,
      headers: noindexHeaders,
    }));

    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
      headers.unshift({
        source: "/:path*",
        headers: noindexHeaders,
      });
    }

    return headers;
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.medinehuzur.com",
          },
        ],
        destination: "https://medinehuzur.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
