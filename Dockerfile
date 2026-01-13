FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["EMS.sln", "./"]
COPY ["src/EMS.API/EMS.API.csproj", "src/EMS.API/"]
COPY ["src/EMS.Application/EMS.Application.csproj", "src/EMS.Application/"]
COPY ["src/EMS.Infrastructure/EMS.Infrastructure.csproj", "src/EMS.Infrastructure/"]
COPY ["src/EMS.Domain/EMS.Domain.csproj", "src/EMS.Domain/"]

# Restore dependencies
RUN dotnet restore "src/EMS.API/EMS.API.csproj"

# Copy everything else
COPY . .

# Build and publish
WORKDIR "/src/src/EMS.API"
RUN dotnet publish "EMS.API.csproj" -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Railway uses PORT environment variable
ENV ASPNETCORE_URLS=http://+:${PORT:-5000}
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000
ENTRYPOINT ["dotnet", "EMS.API.dll"]
