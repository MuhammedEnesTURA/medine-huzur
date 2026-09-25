using System.Data.Common;
using Microsoft.AspNetCore.Mvc;

namespace MedineHuzur.Web.Services;

public sealed class DatabaseExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DatabaseExceptionMiddleware> _logger;

    public DatabaseExceptionMiddleware(
        RequestDelegate next,
        ILogger<DatabaseExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception) when (IsDatabaseFailure(exception))
        {
            if (context.Response.HasStarted)
            {
                throw;
            }

            _logger.LogError(
                "Database request failed. TraceId: {TraceId}, ExceptionType: {ExceptionType}",
                context.TraceIdentifier,
                exception.GetType().Name);

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "Servis geçici olarak kullanılamıyor.",
                Detail = "Veritabanı hizmetine şu anda erişilemiyor."
            };
            problem.Extensions["message"] = "Veritabanı hizmetine şu anda erişilemiyor.";
            problem.Extensions["traceId"] = context.TraceIdentifier;

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(
                problem,
                cancellationToken: context.RequestAborted);
        }
    }

    private static bool IsDatabaseFailure(Exception exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is DbException)
            {
                return true;
            }
        }

        return false;
    }
}
