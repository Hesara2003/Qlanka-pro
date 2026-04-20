# Sprint 4 Local Execution Commands

## Frontend

### Install dependencies
```bash
cd frontend
npm install
```

### Run all tests
```bash
npm test
```

### Run coverage
```bash
npm run test:coverage
```

### Run specific test files
```bash
npx vitest run src/pages/DashboardPage.test.tsx src/components/serviceCenter/ServiceCenterCard.test.tsx --pool=threads --maxWorkers=1
```

### Run frontend app locally
```bash
npm run dev
```

## Backend

### Restore + run backend test project
```bash
cd ..
dotnet test backend/QueueLanka.API.Tests/QueueLanka.API.Tests.csproj
```

### Run focused RBAC/security/performance tests
```bash
dotnet test backend/QueueLanka.API.Tests/QueueLanka.API.Tests.csproj --filter "FullyQualifiedName~CounterAuthorizationTests|FullyQualifiedName~ReportsAuthorizationTests|FullyQualifiedName~QueueApiConsistencyAndPerformanceTests"
```

### Run full solution tests
```bash
dotnet test Qlanka-pro.sln
```

### Run queue API locally (example)
```bash
dotnet run --project backend/QueueLanka.Queue/QueueLanka.Queue.csproj
```

### Run gateway locally (example)
```bash
dotnet run --project backend/QueueLanka.Gateway/QueueLanka.Gateway.csproj
```

## Performance

### Run local API latency/assertion tests
```bash
dotnet test backend/QueueLanka.API.Tests/QueueLanka.API.Tests.csproj --filter "FullyQualifiedName~QueueApiConsistencyAndPerformanceTests"
```

### Optional full-stack local simulation
```bash
docker compose up -d
```
