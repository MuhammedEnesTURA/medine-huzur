namespace MedineHuzur.Web.Settings;

public class JwtSettings
{
    public string Key { get; set; } = string.Empty;

    public string Issuer { get; set; } = "MedineHuzur";

    public string Audience { get; set; } = "MedineHuzurUsers";

    public int ExpireMinutes { get; set; } = 60;
}