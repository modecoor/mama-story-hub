import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPreviousNext?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPreviousNext = true,
  maxVisiblePages = 7,
  className
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const half = Math.floor(maxVisiblePages / 2);

    if (totalPages <= maxVisiblePages) {
      // Показываем все страницы
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Показываем с эллипсисами
      if (currentPage <= half + 1) {
        // Начало: 1, 2, 3, 4, 5, ..., total
        for (let i = 1; i <= maxVisiblePages - 2; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - half) {
        // Конец: 1, ..., total-4, total-3, total-2, total-1, total
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - (maxVisiblePages - 3); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Середина: 1, ..., current-1, current, current+1, ..., total
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* Previous button */}
      {showPreviousNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 w-9 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Page numbers */}
      {visiblePages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <div key={`ellipsis-${index}`} className="flex h-9 w-9 items-center justify-center">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          );
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="h-9 w-9 p-0"
          >
            {page}
          </Button>
        );
      })}

      {/* Next button */}
      {showPreviousNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 w-9 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
  className?: string;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onLoadMore,
  loading,
  hasMore,
  className
}) => {
  if (!hasMore) return null;

  return (
    <div className={`flex justify-center ${className}`}>
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={loading}
        className="min-w-[120px]"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
            Загрузка...
          </>
        ) : (
          'Загрузить ещё'
        )}
      </Button>
    </div>
  );
};