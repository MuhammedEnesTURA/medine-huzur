using System.Net;

namespace MedineHuzur.Web.Payments;

public static class KuveytTurkHttpClientHandlerFactory
{
    public const string ProxyUrlKey = "KUVEYTTURK_PROXY_URL";
    public const string ProxyUserNameKey = "KUVEYTTURK_PROXY_USERNAME";
    public const string ProxyPasswordKey = "KUVEYTTURK_PROXY_PASSWORD";

    public static SocketsHttpHandler Create(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var proxyUrl = configuration[ProxyUrlKey];
        if (string.IsNullOrWhiteSpace(proxyUrl))
        {
            return CreateDirectHandler();
        }

        if (!Uri.TryCreate(proxyUrl.Trim(), UriKind.Absolute, out var proxyUri) ||
            !string.Equals(proxyUri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrWhiteSpace(proxyUri.Host))
        {
            throw new InvalidOperationException(
                $"{ProxyUrlKey} must be an absolute HTTPS proxy URL.");
        }

        if (!string.IsNullOrEmpty(proxyUri.UserInfo))
        {
            throw new InvalidOperationException(
                $"{ProxyUrlKey} must not contain credentials. Use {ProxyUserNameKey} and {ProxyPasswordKey}.");
        }

        var userName = configuration[ProxyUserNameKey];
        var password = configuration[ProxyPasswordKey];

        if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                $"{ProxyUserNameKey} and {ProxyPasswordKey} are required when {ProxyUrlKey} is configured.");
        }

        var proxy = new WebProxy(proxyUri)
        {
            Credentials = new NetworkCredential(userName, password)
        };

        return new SocketsHttpHandler
        {
            UseProxy = true,
            Proxy = proxy,
            ConnectTimeout = TimeSpan.FromSeconds(20),
            PooledConnectionLifetime = TimeSpan.FromMinutes(5)
        };
    }

    private static SocketsHttpHandler CreateDirectHandler() =>
        new()
        {
            UseProxy = false,
            ConnectTimeout = TimeSpan.FromSeconds(20),
            PooledConnectionLifetime = TimeSpan.FromMinutes(5)
        };
}
