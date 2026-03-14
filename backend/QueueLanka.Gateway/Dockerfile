FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["QueueLanka.Gateway/QueueLanka.Gateway.csproj", "QueueLanka.Gateway/"]
RUN dotnet restore "QueueLanka.Gateway/QueueLanka.Gateway.csproj"
COPY . .
WORKDIR "/src/QueueLanka.Gateway"
RUN dotnet build "QueueLanka.Gateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "QueueLanka.Gateway.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=80
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "QueueLanka.Gateway.dll"]
