using System.Net;
using System.Net.Mail;
using MedineHuzur.Web.Settings;
using Microsoft.Extensions.Options;

namespace MedineHuzur.Web.Services;

public class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(
        IOptions<EmailSettings> settings,
        ILogger<SmtpEmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendAsync(
        string to,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(to))
        {
            throw new ArgumentException("Recipient email is required.", nameof(to));
        }

        if (string.IsNullOrWhiteSpace(_settings.Host) ||
            string.IsNullOrWhiteSpace(_settings.User) ||
            string.IsNullOrWhiteSpace(_settings.Password) ||
            string.IsNullOrWhiteSpace(_settings.FromAddress))
        {
            _logger.LogWarning(
                "Email settings are missing. Email was not sent. To: {To}, Subject: {Subject}",
                to,
                subject);

            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_settings.FromAddress, _settings.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(to);

        using var client = new SmtpClient(_settings.Host, _settings.Port)
        {
            EnableSsl = _settings.EnableSsl,
            Credentials = new NetworkCredential(_settings.User, _settings.Password),
            Timeout = 10000 // 10 saniye timeout (Sunucunun sonsuza kadar beklemesini engeller)
        };

        try
        {
            _logger.LogInformation("SMTP Bağlantısı deneniyor: {Host}:{Port} üzerinden {To} adresine...", _settings.Host, _settings.Port, to);
            
            await client.SendMailAsync(message, cancellationToken);
            
            _logger.LogInformation("E-posta başarıyla gönderildi: {To}", to);
        }
        catch (SmtpException ex)
        {
            _logger.LogError(ex, "SMTP Hatası! Durum Kodu: {StatusCode}. Mesaj: {Message}", ex.StatusCode, ex.Message);
            throw; 
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMTP E-posta gönderiminde beklenmeyen hata: {Message}", ex.Message);
            throw;
        }
    }
}