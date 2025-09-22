import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { PostCard } from '@/components/PostCard';
import { LoadMoreButton } from '@/components/Pagination';
import { SearchBar } from '@/components/SearchBar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePosts } from '@/hooks/usePosts';
import { useSignals } from '@/hooks/useSignals';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState<'date' | 'relevance'>('relevance');
  const [filterType, setFilterType] = useState<'all' | 'article' | 'story' | 'question'>('all');
  
  const query = searchParams.get('q') || '';
  const { sendSignal } = useSignals();

  const searchResults = usePosts({
    search: query,
    type: filterType === 'all' ? undefined : filterType,
    mode: sortBy === 'date' ? 'new' : 'popular',
    limit: 12
  });

  const handleLike = async (postId: string) => {
    await sendSignal(postId, 'like');
    searchResults.refresh();
  };

  const handleBookmark = async (postId: string) => {
    await sendSignal(postId, 'bookmark');
  };

  const handleShare = async (postId: string) => {
    await sendSignal(postId, 'share');
  };

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as 'date' | 'relevance');
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value as 'all' | 'article' | 'story' | 'question');
  };

  useEffect(() => {
    if (query) {
      searchResults.refresh();
    }
  }, [query, sortBy, filterType]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'Статьи';
      case 'story': return 'Истории';
      case 'question': return 'Вопросы';
      default: return 'Все типы';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto mb-6">
            <SearchBar 
              className="w-full"
            />
          </div>
          
          {query && (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">
                Результаты поиска
              </h1>
              <p className="text-muted-foreground">
                По запросу <span className="font-semibold">"{query}"</span>
                {searchResults.pagination.total > 0 && (
                  <> найдено {searchResults.pagination.total} результатов</>
                )}
              </p>
            </div>
          )}
        </div>

        {query ? (
          <>
            {/* Filters and Sorting */}
            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Фильтры:</span>
                    </div>
                    
                    <Select value={filterType} onValueChange={handleFilterChange}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
                        <SelectItem value="article">Статьи</SelectItem>
                        <SelectItem value="story">Истории</SelectItem>
                        <SelectItem value="question">Вопросы</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Сортировка:</span>
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">По релевантности</SelectItem>
                        <SelectItem value="date">По дате</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    {query}
                  </Badge>
                  
                  {filterType !== 'all' && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getTypeLabel(filterType)}
                      <button
                        onClick={() => setFilterType('all')}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.loading && searchResults.posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Поиск...</p>
              </div>
            ) : searchResults.error ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-destructive mb-4">Ошибка поиска: {searchResults.error}</p>
                  <Button onClick={searchResults.refresh} variant="outline">
                    Попробовать снова
                  </Button>
                </CardContent>
              </Card>
            ) : searchResults.posts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Ничего не найдено</h3>
                  <p className="text-muted-foreground mb-4">
                    По вашему запросу результатов не найдено.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Попробуйте:</p>
                    <ul className="space-y-1">
                      <li>• Проверить правописание</li>
                      <li>• Использовать более общие термины</li>
                      <li>• Попробовать синонимы</li>
                      <li>• Убрать фильтры</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onBookmark={handleBookmark}
                      onShare={handleShare}
                    />
                  ))}
                </div>

                <LoadMoreButton
                  onLoadMore={searchResults.loadMore}
                  loading={searchResults.loading}
                  hasMore={searchResults.hasMore}
                  className="mt-8"
                />
              </>
            )}
          </>
        ) : (
          // No search query - show search tips
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <Search className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-4">Найдите интересные материалы</h2>
              <p className="text-muted-foreground mb-6">
                Введите ключевые слова в поисковую строку выше
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Популярные темы:</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Беременность</p>
                    <p>• Развитие ребенка</p>
                    <p>• Питание</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Здоровье:</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Вакцинация</p>
                    <p>• Детские болезни</p>
                    <p>• Послеродовое восстановление</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Воспитание:</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Детская психология</p>
                    <p>• Образование</p>
                    <p>• Подростки</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SearchPage;