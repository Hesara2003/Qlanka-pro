FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["QueueLanka.ServiceCenter/QueueLanka.ServiceCenter.csproj", "QueueLanka.ServiceCenter/"]
COPY ["QueueLanka.Shared/QueueLanka.Shared.csproj", "QueueLanka.Shared/"]
RUN dotnet restore "QueueLanka.ServiceCenter/QueueLanka.ServiceCenter.csproj"
COPY . .
WORKDIR "/src/QueueLanka.ServiceCenter"
RUN dotnet build "QueueLanka.ServiceCenter.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "QueueLanka.ServiceCenter.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=80
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "QueueLanka.ServiceCenter.dll"]
