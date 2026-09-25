using MedineHuzur.Web.Payments;

namespace Web.Tests;

public sealed class KuveytTurkXmlServiceTests
{
    [Fact]
    public void MalformedXml_IsRejected()
    {
        var service = new KuveytTurkXmlService();
        Assert.Throws<KuveytTurkProtocolException>(() => service.ParseResponse("<broken>"));
    }

    [Fact]
    public void ExternalEntity_IsRejected()
    {
        var service = new KuveytTurkXmlService();
        const string xml = "<!DOCTYPE x [<!ENTITY e SYSTEM 'file:///etc/passwd'>]><x>&e;</x>";
        Assert.Throws<KuveytTurkProtocolException>(() => service.ParseResponse(xml));
    }
}
