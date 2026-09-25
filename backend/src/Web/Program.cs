using System.Net;
using System.Text;
using MedineHuzur.Domain;
using MedineHuzur.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MedineHuzur.Web.Services;
using MedineHuzur.Web.Settings;
using Microsoft.OpenApi.Models;
using MedineHuzur.Web.Payments;
using Microsoft.AspNetCore.HttpOverrides;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("shipping-policy.json", optional: false, reloadOnChange: false);
var shippingSettings = builder.Configuration.GetSection("Shipping");
builder.Services.AddSingleton(new ShippingPolicy(
    shippingSettings.GetValue<decimal>("FlatFeeTry"),
    shippingSettings.GetValue<decimal>("FreeThresholdTry"),
    shippingSettings.GetValue<int>("DispatchMinBusinessDays"),
    shippingSettings.GetValue<int>("DispatchMaxBusinessDays")));

var configuration = builder.Configuration;

var primaryConnectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__Default");

var legacyConnectionString =
    Environment.GetEnvironmentVariable("MEDINE_HUZUR_CONNECTION_STRING");

var connectionString = !string.IsNullOrWhiteSpace(primaryConnectionString)
    ? primaryConnectionString
    : !string.IsNullOrWhiteSpace(legacyConnectionString)
        ? legacyConnectionString
        : configuration.GetConnectionString("Default");

if (string.IsNullOrWhiteSpace(connectionString) ||
    connectionString == "SET_FROM_ENV_OR_DEVELOPMENT_SETTINGS")
{
    throw new InvalidOperationException(
        "Database connection string is missing. Set ConnectionStrings:Default or MEDINE_HUZUR_CONNECTION_STRING.");
}

builder.Services.AddDbContextPool<ECommerceContext>(options =>
{
    options.UseSqlServer(connectionString);
});

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.Configure<PaymentOptions>(
    builder.Configuration.GetSection(PaymentOptions.SectionName));

builder.Services.Configure<KuveytTurkOptions>(options =>
{
    builder.Configuration.GetSection(KuveytTurkOptions.SectionName).Bind(options);
    options.Environment = configuration["KUVEYTTURK_ENVIRONMENT"] ?? options.Environment;
    options.CustomerId = configuration["KUVEYTTURK_CUSTOMER_ID"] ?? options.CustomerId;
    options.MerchantId = configuration["KUVEYTTURK_MERCHANT_ID"] ?? options.MerchantId;
    options.ApiUserName = configuration["KUVEYTTURK_API_USERNAME"] ?? options.ApiUserName;
    options.ApiPassword = configuration["KUVEYTTURK_API_PASSWORD"] ?? options.ApiPassword;
    options.OkUrl = configuration["KUVEYTTURK_OK_URL"] ?? options.OkUrl;
    options.FailUrl = configuration["KUVEYTTURK_FAIL_URL"] ?? options.FailUrl;
});

builder.Services.AddScoped<MockPaymentProvider>();
builder.Services.AddHttpClient<KuveytTurkPaymentProvider>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(120);
});
builder.Services.AddScoped<IKuveytTurkGateway>(serviceProvider =>
    serviceProvider.GetRequiredService<KuveytTurkPaymentProvider>());
builder.Services.AddSingleton<KuveytTurkHashService>();
builder.Services.AddSingleton<KuveytTurkXmlService>();
builder.Services.AddScoped<KuveytTurkPaymentProcessor>();
builder.Services.AddScoped<PaymentProviderFactory>();
var trustedForwardedProxyIps = (configuration["FORWARDED_HEADERS_TRUSTED_PROXIES"] ?? string.Empty)
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Select(value =>
        IPAddress.TryParse(value, out var address)
            ? address
            : throw new InvalidOperationException(
                $"Invalid FORWARDED_HEADERS_TRUSTED_PROXIES IP address: {value}"))
    .ToArray();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;
    options.RequireHeaderSymmetry = false;

    foreach (var proxy in trustedForwardedProxyIps)
    {
        options.KnownProxies.Add(proxy);
    }
});
builder.Services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
builder.Services.Configure<EmailSettings>(configuration.GetSection("Email"));
builder.Services.Configure<AdminSeedSettings>(configuration.GetSection("AdminSeed"));
builder.Services.Configure<CloudinarySettings>(configuration.GetSection("Cloudinary"));
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<DatabaseDiagnosticsService>();



builder.Services.AddHostedService<AdminSeedService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Medine Huzur API",
        Version = "v1",
        Description = "Medine Huzur e-ticaret backend API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT token girin. Örnek: Bearer eyJhbGciOi..."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
var allowedOrigins =
    configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? Array.Empty<string>();
var allowedOriginPatterns =
    configuration.GetSection("Cors:AllowedOriginPatterns").Get<string[]>()
    ?? Array.Empty<string>();
var allowedOriginRegexes = allowedOriginPatterns
    .Where(pattern => !string.IsNullOrWhiteSpace(pattern))
    .Select(pattern => new Regex(
        $"^{Regex.Escape(pattern.Trim()).Replace("\\*", "[a-z0-9-]+")}$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        TimeSpan.FromMilliseconds(100)))
    .ToArray();
var allowedOriginSet = allowedOrigins
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.TrimEnd('/'))
    .ToHashSet(StringComparer.OrdinalIgnoreCase);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
                allowedOriginSet.Contains(origin.TrimEnd('/')) ||
                allowedOriginRegexes.Any(regex => regex.IsMatch(origin)))
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var jwtKey =
    configuration["Jwt:Key"]
    ?? Environment.GetEnvironmentVariable("MEDINE_HUZUR_JWT_KEY");

var jwtIssuer = configuration["Jwt:Issuer"] ?? "MedineHuzur";
var jwtAudience = configuration["Jwt:Audience"] ?? "MedineHuzurUsers";

if (string.IsNullOrWhiteSpace(jwtKey) ||
    jwtKey == "SET_FROM_ENV_OR_DEVELOPMENT_SETTINGS")
{
    throw new InvalidOperationException(
        "JWT key is missing. Set Jwt:Key or MEDINE_HUZUR_JWT_KEY.");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseForwardedHeaders();

app.UseSwagger();
app.UseSwaggerUI();

app.UseStaticFiles();

app.UseCors("Frontend");

app.UseMiddleware<DatabaseExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () =>
{
    return Results.Ok(new
    {
        status = "ok",
        app = "Medine Huzur API",
        utc = DateTime.UtcNow
    });
});

app.MapGet("/health/process", () =>
{
    return Results.Ok(new
    {
        status = "ok",
        app = "Medine Huzur API",
        utc = DateTime.UtcNow
    });
});

app.MapGet("/health/database", async (
    DatabaseDiagnosticsService diagnostics,
    CancellationToken cancellationToken) =>
{
    var reachable = await diagnostics.CanConnectAsync(cancellationToken);

    return reachable
        ? Results.Ok(new { status = "ok", database = "reachable" })
        : Results.Json(
            new
            {
                status = "degraded",
                database = "unreachable",
                message = "Veritabanı hizmetine şu anda erişilemiyor."
            },
            statusCode: StatusCodes.Status503ServiceUnavailable);
});

app.Run();
