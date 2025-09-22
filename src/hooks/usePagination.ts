import { useState, useCallback } from 'react';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export const usePagination = (initialPageSize = 10) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const nextPage = useCallback(() => {
    if (hasMore) {
      setPage(prev => prev + 1);
    }
  }, [hasMore]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1) {
      setPage(newPage);
    }
  }, []);

  const reset = useCallback(() => {
    setPage(1);
    setTotal(0);
    setHasMore(true);
  }, []);

  const updatePagination = useCallback((newTotal: number, newHasMore: boolean) => {
    setTotal(newTotal);
    setHasMore(newHasMore);
  }, []);

  const getOffset = useCallback(() => {
    return (page - 1) * pageSize;
  }, [page, pageSize]);

  const getTotalPages = useCallback(() => {
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

  return {
    page,
    pageSize,
    total,
    hasMore,
    nextPage,
    prevPage,
    goToPage,
    reset,
    updatePagination,
    getOffset,
    getTotalPages,
    setPageSize,
    pagination: {
      page,
      pageSize,
      total,
      hasMore
    }
  };
};