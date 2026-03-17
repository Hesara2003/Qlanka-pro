FROM mcr.microsoft.com/dotnet/runtime:8.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["QueueLanka.Notification/QueueLanka.Notification.csproj", "QueueLanka.Notification/"]
COPY ["QueueLanka.Shared/QueueLanka.Shared.csproj", "QueueLanka.Shared/"]
RUN dotnet restore "QueueLanka.Notification/QueueLanka.Notification.csproj"
COPY . .
WORKDIR "/src/QueueLanka.Notification"
RUN dotnet build "QueueLanka.Notification.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "QueueLanka.Notification.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "QueueLanka.Notification.dll"]
