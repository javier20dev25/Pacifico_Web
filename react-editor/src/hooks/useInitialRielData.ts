// src/hooks/useInitialRielData.ts
import { useState, useEffect } from 'react';
import useRielStore from '@/stores/rielStore';

export function useInitialRielData() {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const loadRielData = useRielStore((state) => state.loadRielData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await loadRielData();
        setIsError(false);
      } catch (error) {
        console.error("Failed to load Riel initial data:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [loadRielData]);

  return { isLoading, isError };
}
