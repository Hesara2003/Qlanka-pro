# Service Center API Integration - SCRUM-25

This document describes the frontend integration with the service center listing API, providing real-time data fetching and display capabilities.

## Overview

The service center API integration provides:
- ✅ Connection to backend API endpoints
- ✅ Real-time service center data fetching
- ✅ Service center availability display
- ✅ Automatic retry with exponential backoff
- ✅ Auto-refresh capabilities
- ✅ Type-safe TypeScript interfaces
- ✅ React hooks for easy integration

## Files Structure

```
frontend/src/
├── api/
│   └── serviceCenterApi.ts       # API functions with retry logic
├── types/
│   └── serviceCenter.ts          # TypeScript type definitions
├── hooks/
│   └── useServiceCenters.ts      # React hooks for data fetching
└── examples/
    └── ServiceCenterApiExamples.tsx  # Usage examples
```

## Type Definitions

### ServiceCenter Interface

```typescript
interface ServiceCenter {
  centerId: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
  timezone: string;
  capacity: number;
  openingTime: string;
  closingTime: string;
  isAvailable: boolean;  // Real-time availability status
  isActive: boolean;      // Center operational status
  createdAt: string;
}
```

## API Functions

### `getAllServiceCenters()`
Fetches all service centers with automatic retry on failure.

```typescript
const centers = await getAllServiceCenters();
```

### `getServiceCenterById(centerId)`
Fetches a specific service center by ID.

```typescript
const center = await getServiceCenterById(1);
```

### `getAvailableServiceCenters()`
Fetches only available and active service centers.

```typescript
const availableCenters = await getAvailableServiceCenters();
```

### `checkServiceCenterAvailability(centerId)`
Checks if a specific service center is currently available.

```typescript
const isAvailable = await checkServiceCenterAvailability(1);
```

## React Hooks

### `useServiceCenters(options)`

Fetches and manages service center data with optional auto-refresh.

**Options:**
- `autoRefresh`: Enable automatic data refresh (default: false)
- `refreshInterval`: Refresh interval in milliseconds (default: 30000)
- `onError`: Error callback function

**Returns:**
- `centers`: Array of service centers
- `loading`: Loading state
- `error`: Error message (if any)
- `refresh`: Manual refresh function
- `lastUpdated`: Last data fetch timestamp

**Example:**

```typescript
function ServiceCentersList() {
  const { centers, loading, error, refresh, lastUpdated } = useServiceCenters({
    autoRefresh: true,
    refreshInterval: 30000,
    onError: (err) => console.error(err)
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh Now</button>
      <p>Last updated: {lastUpdated?.toLocaleTimeString()}</p>
      {centers.map(center => (
        <div key={center.centerId}>
          <h3>{center.name}</h3>
          <p>Status: {center.isAvailable ? 'Available' : 'Unavailable'}</p>
        </div>
      ))}
    </div>
  );
}
```

### `useServiceCenter(centerId, options)`

Fetches a specific service center with optional auto-refresh.

**Example:**

```typescript
function ServiceCenterDetails({ id }: { id: number }) {
  const { center, loading, error } = useServiceCenter(id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!center) return <div>Not found</div>;

  return (
    <div>
      <h2>{center.name}</h2>
      <p>{center.address}</p>
      <p>Available: {center.isAvailable ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Features

### 1. Automatic Retry with Exponential Backoff
Failed requests are automatically retried up to 3 times with increasing delays:
- 1st retry: 1 second delay
- 2nd retry: 2 seconds delay
- 3rd retry: 4 seconds delay

### 2. Intelligent Error Handling
- Network errors are handled gracefully
- Client errors (4xx) are not retried
- Server errors (5xx) trigger retry mechanism
- Timeout errors provide user-friendly messages

### 3. Real-time Updates
Using the `autoRefresh` option, data is automatically refreshed at specified intervals, ensuring users always see current availability information.

### 4. Type Safety
Full TypeScript support with proper type definitions ensures compile-time safety and better IDE autocomplete.

## Error Handling

All API functions throw errors with user-friendly messages:

```typescript
try {
  const centers = await getAllServiceCenters();
} catch (error) {
  // error.message contains user-friendly error text
  console.error(error.message);
}
```

## Best Practices

1. **Use hooks in components** - Prefer `useServiceCenters` for automatic state management
2. **Enable auto-refresh** - For real-time availability, use `autoRefresh: true`
3. **Handle errors** - Always handle error states in your UI
4. **Manual refresh** - Provide refresh buttons for user-triggered updates
5. **Cleanup** - Hooks automatically cleanup intervals on unmount

## Integration Checklist

- ✅ Backend API endpoints (`/api/service-centers`)
- ✅ TypeScript type definitions
- ✅ API functions with retry logic
- ✅ React hooks for state management
- ✅ Auto-refresh capabilities
- ✅ Error handling and user feedback
- ✅ Real-time availability display
- ✅ Example usage components

## Testing the Integration

1. Import the hook in your component:
```typescript
import { useServiceCenters } from '../hooks/useServiceCenters';
```

2. Use in component:
```typescript
const { centers, loading, error } = useServiceCenters();
```

3. Display the data:
```typescript
{centers.map(center => (
  <div key={center.centerId}>
    {center.name} - {center.isAvailable ? 'Available' : 'Unavailable'}
  </div>
))}
```

## API Endpoint Configuration

The base URL is configured in `axiosInstance.ts`:
```typescript
baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"
```

Set `VITE_API_BASE_URL` in your `.env` file:
```
VITE_API_BASE_URL=http://localhost:5000
```

## Acceptance Criteria Status

### ✅ Connect the frontend UI to the backend API
- API functions created with proper error handling
- Axios instance configured with base URL and auth headers
- TypeScript types defined for type safety

### ✅ Fetch real-time service center data
- `getAllServiceCenters()` function implemented
- `getServiceCenterById()` function implemented
- Automatic retry mechanism on failures
- Custom React hooks with state management

### ✅ Display service center availability
- `isAvailable` field in ServiceCenter type
- `isActive` field for operational status
- Helper function `checkServiceCenterAvailability()`
- Auto-refresh capability for real-time updates

## Next Steps

To use this integration in your UI:
1. Import the necessary hooks or API functions
2. Call the functions/hooks in your components
3. Handle loading and error states
4. Display the service center data
5. Enable auto-refresh for real-time updates

See `ServiceCenterApiExamples.tsx` for complete usage examples.
