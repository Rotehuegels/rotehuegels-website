import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.rotehuegels.com"

  const routes = [
    "",
    "/about",
    "/services",
    "/services/business",
    "/services/consultancy",
    "/services/research",
    "/digital-solutions",
    "/success-stories",
    "/current-updates",
    "/careers",
    "/contact",
    "/register",
    "/rex",
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }))
}