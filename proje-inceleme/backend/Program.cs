using System.Text;
using MedineHuzur.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MedineHuzur.Web.Services;
using MedineHuzur.Web.Settings;
using Microsoft.OpenApi.Models;
using MedineHuzur.Web.Payments;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

var configuration = builder.Configuration;

var connectionString =
    configuration.GetConnectionString("Default")
    ?? Environment.GetEnvironmentVariable("MEDINE_HUZUR_CONNECTION_STRING");

if (string.IsNullOrWhiteSpace(connectionString) ||
    connectionString == "SET_FROM_ENV_OR_DEVELOPMENT_SETTINGS")
{
    throw new InvalidOperationException(
        "Database connection string is missing. Set ConnectionStrings:Default or MEDINE_HUZUR_CONNECTION_STRING.");
}

builder.Services.AddDbContext<ECommerceContext>(options =>
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

builder.Services.Configure<KuveytTurkOptions>(
    builder.Configuration.GetSection(KuveytTurkOptions.SectionName));

builder.Services.AddScoped<MockPaymentProvider>();
builder.Services.AddScoped<KuveytTurkPaymentProvider>();
builder.Services.AddScoped<PaymentProviderFactory>();
builder.Services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
builder.Services.Configure<EmailSettings>(configuration.GetSection("Email"));
builder.Services.Configure<AdminSeedSettings>(configuration.GetSection("AdminSeed"));
builder.Services.Configure<CloudinarySettings>(configuration.GetSection("Cloudinary"));
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();



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

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
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

app.UseSwagger();
app.UseSwaggerUI();

app.UseStaticFiles();

app.UseCors("Frontend");

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

app.Run();