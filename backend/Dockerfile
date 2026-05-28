# Base image olarak .NET 10 SDK kullanıyoruz
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

# Çalışma dizinini ayarla
WORKDIR /app

# .csproj dosyalarını kopyala ve restore et
COPY src/Web/Web.csproj ./Web/
COPY src/Domain/Domain.csproj ./Domain/
COPY src/Infrastructure/Infrastructure.csproj ./Infrastructure/
COPY src/Application/Application.csproj ./Application/

RUN dotnet restore Web/Web.csproj

# Tüm kaynak kodunu kopyala
COPY src/ ./src/

# Uygulamayı publish et
RUN dotnet publish Web/Web.csproj -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Port ayarla
EXPOSE 5096

# Uygulamayı çalıştır
ENTRYPOINT ["dotnet", "Web.dll"]