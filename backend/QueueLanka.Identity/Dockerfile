FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["QueueLanka.Identity/QueueLanka.Identity.csproj", "QueueLanka.Identity/"]
COPY ["QueueLanka.Shared/QueueLanka.Shared.csproj", "QueueLanka.Shared/"]
RUN dotnet restore "QueueLanka.Identity/QueueLanka.Identity.csproj"
COPY . .
WORKDIR "/src/QueueLanka.Identity"
RUN dotnet build "QueueLanka.Identity.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "QueueLanka.Identity.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "QueueLanka.Identity.dll"]
