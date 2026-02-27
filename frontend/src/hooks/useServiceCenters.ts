// Custom React Hook for Service Center Data - SCRUM-25
import { useState, useEffect, useCallback, useRef } from "react";
import type { ServiceCenter } from "../types/serviceCenter";
import { getAllServiceCenters, getServiceCenterById } from "../api/serviceCenterApi";

interface UseServiceCentersOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onError?: (error: Error) => void;
}

interface UseServiceCentersResult {
  centers: ServiceCenter[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Custom hook to fetch and manage service center data with auto-refresh
 * @param options - Configuration options for the hook
 * @returns UseServiceCentersResult
 */
export function useServiceCenters(
  options: UseServiceCentersOptions = {}
): UseServiceCentersResult {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // Default: 30 seconds
    onError,
  } = options;

  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const fetchCenters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAllServiceCenters();
      
      if (isMountedRef.current) {
        setCenters(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load service centers";
      
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [onError]);

  // Initial fetch
  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchCenters();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchCenters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    centers,
    loading,
    error,
    refresh: fetchCenters,
    lastUpdated,
  };
}

interface UseServiceCenterOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
}

interface UseServiceCenterResult {
  center: ServiceCenter | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Custom hook to fetch a specific service center by ID
 * @param centerId - The ID of the service center
 * @param options - Configuration options
 * @returns UseServiceCenterResult
 */
export function useServiceCenter(
  centerId: number,
  options: UseServiceCenterOptions = {}
): UseServiceCenterResult {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    onError,
  } = options;

  const [center, setCenter] = useState<ServiceCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const fetchCenter = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getServiceCenterById(centerId);
      
      if (isMountedRef.current) {
        setCenter(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load service center";
      
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [centerId, onError]);

  useEffect(() => {
    fetchCenter();
  }, [fetchCenter]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchCenter();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchCenter]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    center,
    loading,
    error,
    refresh: fetchCenter,
    lastUpdated,
  };
}
