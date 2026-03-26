import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/tickets/",
          "/requests/",
        ],
      },
    ],
    sitemap: "https://www.rotehuegels.com/sitemap.xml",
  }
}