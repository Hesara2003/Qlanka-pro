// Example Usage of Service Center API Integration - SCRUM-25
// This file demonstrates how to use the service center API integration

import { useServiceCenters, useServiceCenter } from "../hooks/useServiceCenters";
import type { ServiceCenter } from "../types/serviceCenter";

/**
 * Example 1: Basic usage - Fetch all service centers
 */
export function ServiceCentersList() {
  const { centers, loading, error, refresh } = useServiceCenters();

  if (loading) return <div>Loading service centers...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <ul>
        {centers.map((center) => (
          <li key={center.centerId}>
            {center.name} - {center.isAvailable ? "Available" : "Unavailable"}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example 2: With auto-refresh - Real-time updates every 30 seconds
 */
export function ServiceCentersListWithAutoRefresh() {
  const { centers, loading, error, lastUpdated } = useServiceCenters({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    onError: (err) => console.error("Failed to fetch centers:", err),
  });

  return (
    <div>
      {lastUpdated && <p>Last updated: {lastUpdated.toLocaleTimeString()}</p>}
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      
      <div>
        {centers.map((center) => (
          <div key={center.centerId}>
            <h3>{center.name}</h3>
            <p>{center.address}</p>
            <p>Status: {center.isAvailable ? "Available" : "Unavailable"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 3: Fetch a specific service center by ID
 */
export function ServiceCenterDetails({ centerId }: { centerId: number }) {
  const { center, loading, error, refresh } = useServiceCenter(centerId);

  if (loading) return <div>Loading service center...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!center) return <div>Service center not found</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <h2>{center.name}</h2>
      <p>Address: {center.address}</p>
      <p>Phone: {center.phone}</p>
      <p>Email: {center.email}</p>
      <p>Capacity: {center.capacity}</p>
      <p>Hours: {center.openingTime} - {center.closingTime}</p>
      <p>Status: {center.isAvailable ? "Available" : "Unavailable"}</p>
    </div>
  );
}

/**
 * Example 4: Using API functions directly (without hooks)
 */
import { getAllServiceCenters, getAvailableServiceCenters } from "../api/serviceCenterApi";

export async function fetchAndDisplayCenters() {
  try {
    // Fetch all centers
    const allCenters = await getAllServiceCenters();
    console.log("All centers:", allCenters);

    // Fetch only available centers
    const availableCenters = await getAvailableServiceCenters();
    console.log("Available centers:", availableCenters);

    return allCenters;
  } catch (error) {
    console.error("Error fetching centers:", error);
    throw error;
  }
}

/**
 * Example 5: Filtering and searching
 */
export function FilterableServiceCenters() {
  const { centers, loading, error } = useServiceCenters();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showOnlyAvailable, setShowOnlyAvailable] = React.useState(false);

  const filteredCenters = centers.filter((center: ServiceCenter) => {
    const matchesSearch = center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         center.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = !showOnlyAvailable || (center.isAvailable && center.isActive);
    return matchesSearch && matchesAvailability;
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search centers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={showOnlyAvailable}
          onChange={(e) => setShowOnlyAvailable(e.target.checked)}
        />
        Show only available
      </label>

      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      
      <div>
        {filteredCenters.map((center) => (
          <div key={center.centerId}>
            <h3>{center.name}</h3>
            <p>{center.address}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Note: Add `import React from 'react';` at the top when using this component
