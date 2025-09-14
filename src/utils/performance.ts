/**
 * Performance optimization utilities
 * Addresses UI freezing, memory leaks, and inefficient rendering
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

/**
 * Debounce hook to prevent excessive function calls
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): [T, () => void] => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  const cancelDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, cancelDebounce];
};

/**
 * Throttle hook to limit function execution frequency
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T => {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

/**
 * Debounced value hook for search inputs
 */
export const useDebouncedValue = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Virtual list hook for large datasets
 */
export const useVirtualList = <T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const containerElementCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      startIndex + containerElementCount + overscan * 2
    );

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange
  };
};

/**
 * Memoized search hook with filtering
 */
export const useMemoizedSearch = <T>(
  items: T[],
  searchTerm: string,
  searchKeys: (keyof T)[],
  delay: number = 300
) => {
  const debouncedSearchTerm = useDebouncedValue(searchTerm, delay);

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return items;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    
    return items.filter(item => {
      return searchKeys.some(key => {
        const value = item[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        return false;
      });
    });
  }, [items, debouncedSearchTerm, searchKeys]);

  return filteredItems;
};

/**
 * Pagination hook for large datasets
 */
export const usePagination = <T>(
  items: T[],
  itemsPerPage: number = 10
) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

/**
 * Memory-safe interval hook
 */
export const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

/**
 * Component render count tracker (for debugging)
 */
export const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
};

/**
 * Memory usage monitor hook
 */
export const useMemoryMonitor = (threshold: number = 50) => {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  const [isHighUsage, setIsHighUsage] = useState(false);

  useInterval(() => {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      const total = memory.totalJSHeapSize / (1024 * 1024); // Convert to MB
      const percentage = (used / total) * 100;

      setMemoryUsage({ used, total, percentage });
      setIsHighUsage(percentage > threshold);

      if (percentage > threshold && process.env.NODE_ENV === 'development') {
        console.warn(`Memory usage high: ${percentage.toFixed(2)}%`);
      }
    }
  }, 5000); // Check every 5 seconds

  return { memoryUsage, isHighUsage };
};

/**
 * Prevent memory leaks from async operations
 */
export const useAsyncOperation = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeAsync = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      const result = await asyncFn();
      return isMountedRef.current ? result : null;
    } catch (error) {
      if (isMountedRef.current) {
        throw error;
      }
      return null;
    }
  }, []);

  return { safeAsync, isMounted: () => isMountedRef.current };
};

/**
 * Batch state updates for better performance
 */
export const useBatchedUpdates = <T>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdates = useRef<Partial<T>[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batchUpdate = useCallback((update: Partial<T>) => {
    pendingUpdates.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        let newState = { ...prevState };
        pendingUpdates.current.forEach(update => {
          newState = { ...newState, ...update };
        });
        pendingUpdates.current = [];
        return newState;
      });
    }, 16); // Batch updates within a single frame (16ms)
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate] as const;
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (
  targetRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [targetRef, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
};

/**
 * Cleanup utility for preventing memory leaks
 */
export const useCleanup = () => {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctions.current.push(cleanupFn);
  }, []);

  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      });
    };
  }, []);

  return { addCleanup };
};

/**
 * Performance measurement utilities
 */
export const PerformanceUtils = {
  /**
   * Measure component render time
   */
  measureRender: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${componentName}-start`);
      
      return () => {
        performance.mark(`${componentName}-end`);
        performance.measure(
          `${componentName}-render`,
          `${componentName}-start`,
          `${componentName}-end`
        );
        
        const measure = performance.getEntriesByName(`${componentName}-render`)[0];
        if (measure.duration > 16) { // Longer than one frame
          console.warn(`Slow render detected: ${componentName} took ${measure.duration.toFixed(2)}ms`);
        }
      };
    }
    return () => {};
  },

  /**
   * Profile function execution time
   */
  profileFunction: <T extends (...args: any[]) => any>(
    fn: T,
    functionName: string
  ): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${functionName} execution time: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    }) as T;
  },

  /**
   * Check if component should update based on props
   */
  shouldComponentUpdate: <T extends Record<string, any>>(
    prevProps: T,
    nextProps: T,
    excludeKeys: (keyof T)[] = []
  ): boolean => {
    const keys = Object.keys(nextProps).filter(key => !excludeKeys.includes(key as keyof T));
    
    return keys.some(key => {
      const prev = prevProps[key];
      const next = nextProps[key];
      
      // Deep comparison for objects and arrays
      if (typeof prev === 'object' && typeof next === 'object') {
        return JSON.stringify(prev) !== JSON.stringify(next);
      }
      
      return prev !== next;
    });
  }
};

export default {
  useDebounce,
  useThrottle,
  useDebouncedValue,
  useVirtualList,
  useMemoizedSearch,
  usePagination,
  useInterval,
  useRenderCount,
  useMemoryMonitor,
  useAsyncOperation,
  useBatchedUpdates,
  useIntersectionObserver,
  useCleanup,
  PerformanceUtils
};