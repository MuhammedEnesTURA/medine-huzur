using MedineHuzur.Domain.Entities;

namespace MedineHuzur.Web.Services;

public interface IJwtTokenService
{
    string CreateToken(User user);
}