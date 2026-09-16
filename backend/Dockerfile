FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY backend/src ./backend/src
COPY frontend/config/shipping-policy.json ./frontend/config/shipping-policy.json

RUN dotnet restore backend/src/Web/Web.csproj
RUN dotnet publish backend/src/Web/Web.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Web.dll"]
