using System.Text;
using System.Xml.Linq;
using MedineHuzur.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedineHuzur.Web.Controllers;

[ApiController]
[AllowAnonymous]
public class SitemapController : ControllerBase
{
    private readonly ECommerceContext _db;
    private readonly IConfiguration _configuration;

    public SitemapController(
        ECommerceContext db,
        IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    [HttpGet("/sitemap.xml")]
[HttpGet("/api/sitemap.xml")]
public async Task<IActionResult> GetSitemap(CancellationToken cancellationToken)
    {
        var frontendBaseUrl = GetFrontendBaseUrl();

        XNamespace ns = "http://www.sitemaps.org/schemas/sitemap/0.9";

        var urlset = new XElement(ns + "urlset");

        AddUrl(urlset, ns, $"{frontendBaseUrl}/", "daily", "1.0");
        AddUrl(urlset, ns, $"{frontendBaseUrl}/products", "daily", "0.9");
        AddUrl(urlset, ns, $"{frontendBaseUrl}/contact", "monthly", "0.6");

        AddUrl(urlset, ns, $"{frontendBaseUrl}/legal/merchant-info", "monthly", "0.3");
        AddUrl(urlset, ns, $"{frontendBaseUrl}/legal/pre-information", "monthly", "0.3");
        AddUrl(urlset, ns, $"{frontendBaseUrl}/legal/distance-sales", "monthly", "0.3");
        AddUrl(urlset, ns, $"{frontendBaseUrl}/legal/return-cancellation", "monthly", "0.3");
        AddUrl(urlset, ns, $"{frontendBaseUrl}/legal/delivery", "monthly", "0.3");
        AddUrl(urlset, ns, $"{frontendBaseUrl}/legal/privacy-policy", "monthly", "0.3");
        AddUrl(urlset, ns, $"{frontendBaseUrl}/legal/kvkk", "monthly", "0.3");
        AddUrl(urlset, ns, $"{frontendBaseUrl}/legal/cookie-policy", "monthly", "0.3");

        var products = await _db.Products
            .AsNoTracking()
            .Where(product =>
                product.IsActive &&
                product.Slug != null &&
                product.Slug != "")
            .OrderBy(product => product.Slug)
            .Select(product => new
            {
                product.Slug
            })
            .ToListAsync(cancellationToken);

        foreach (var product in products)
        {
            var slug = product.Slug.Trim();

            if (string.IsNullOrWhiteSpace(slug))
            {
                continue;
            }

            AddUrl(
                urlset,
                ns,
                $"{frontendBaseUrl}/product/{Uri.EscapeDataString(slug)}",
                "weekly",
                "0.9");
        }

        var sitemap = new XDocument(
            new XDeclaration("1.0", "UTF-8", "yes"),
            urlset);

        return Content(
            sitemap.ToString(),
            "application/xml",
            Encoding.UTF8);
    }

    private string GetFrontendBaseUrl()
    {
        return (_configuration["Frontend:BaseUrl"] ?? "https://www.medinehuzur.com")
            .Trim()
            .TrimEnd('/');
    }

    private static void AddUrl(
        XElement urlset,
        XNamespace ns,
        string loc,
        string changefreq,
        string priority)
    {
        urlset.Add(
            new XElement(ns + "url",
                new XElement(ns + "loc", loc),
                new XElement(ns + "lastmod", DateTime.UtcNow.ToString("yyyy-MM-dd")),
                new XElement(ns + "changefreq", changefreq),
                new XElement(ns + "priority", priority)
            )
        );
    }
}