using System.Net;
using MedineHuzur.Web.Payments;
using Microsoft.Extensions.Configuration;

namespace Web.Tests;

public sealed class KuveytTurkHttpClientHandlerFactoryTests
{
    [Fact]
    public void Create_WithoutProxyConfiguration_UsesDirectConnection()
    {
        var configuration = BuildConfiguration();

        using var handler = KuveytTurkHttpClientHandlerFactory.Create(configuration);

        Assert.False(handler.UseProxy);
        Assert.Null(handler.Proxy);
    }

    [Fact]
    public void Create_WithHttpsProxy_ConfiguresAuthenticatedProxy()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            [KuveytTurkHttpClientHandlerFactory.ProxyUrlKey] = "https://pos-proxy.example.com:443",
            [KuveytTurkHttpClientHandlerFactory.ProxyUserNameKey] = "proxy-user",
            [KuveytTurkHttpClientHandlerFactory.ProxyPasswordKey] = "proxy-password"
        });

        using var handler = KuveytTurkHttpClientHandlerFactory.Create(configuration);

        Assert.True(handler.UseProxy);
        var proxy = Assert.IsType<WebProxy>(handler.Proxy);
        var destination = new Uri("https://sanalpos.kuveytturk.com.tr/");
        Assert.Equal(
            new Uri("https://pos-proxy.example.com:443/"),
            proxy.GetProxy(destination));

        var credential = proxy.Credentials?.GetCredential(
            new Uri("https://pos-proxy.example.com:443/"),
            "Basic");

        Assert.NotNull(credential);
        Assert.Equal("proxy-user", credential.UserName);
        Assert.Equal("proxy-password", credential.Password);
    }

    [Theory]
    [InlineData("http://pos-proxy.example.com:3128")]
    [InlineData("not-a-url")]
    public void Create_RejectsNonHttpsOrInvalidProxyUrl(string proxyUrl)
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            [KuveytTurkHttpClientHandlerFactory.ProxyUrlKey] = proxyUrl,
            [KuveytTurkHttpClientHandlerFactory.ProxyUserNameKey] = "proxy-user",
            [KuveytTurkHttpClientHandlerFactory.ProxyPasswordKey] = "proxy-password"
        });

        var exception = Assert.Throws<InvalidOperationException>(
            () => KuveytTurkHttpClientHandlerFactory.Create(configuration));

        Assert.Contains(KuveytTurkHttpClientHandlerFactory.ProxyUrlKey, exception.Message);
    }

    [Fact]
    public void Create_RejectsCredentialsEmbeddedInProxyUrl()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            [KuveytTurkHttpClientHandlerFactory.ProxyUrlKey] = "https://user:password@pos-proxy.example.com:443",
            [KuveytTurkHttpClientHandlerFactory.ProxyUserNameKey] = "proxy-user",
            [KuveytTurkHttpClientHandlerFactory.ProxyPasswordKey] = "proxy-password"
        });

        var exception = Assert.Throws<InvalidOperationException>(
            () => KuveytTurkHttpClientHandlerFactory.Create(configuration));

        Assert.Contains("must not contain credentials", exception.Message);
    }

    [Fact]
    public void Create_RequiresSeparateProxyCredentials()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            [KuveytTurkHttpClientHandlerFactory.ProxyUrlKey] = "https://pos-proxy.example.com:443"
        });

        var exception = Assert.Throws<InvalidOperationException>(
            () => KuveytTurkHttpClientHandlerFactory.Create(configuration));

        Assert.Contains(KuveytTurkHttpClientHandlerFactory.ProxyUserNameKey, exception.Message);
        Assert.Contains(KuveytTurkHttpClientHandlerFactory.ProxyPasswordKey, exception.Message);
    }

    private static IConfiguration BuildConfiguration(
        IReadOnlyDictionary<string, string?>? values = null)
    {
        var builder = new ConfigurationBuilder();

        if (values is not null)
        {
            builder.AddInMemoryCollection(values);
        }

        return builder.Build();
    }
}
