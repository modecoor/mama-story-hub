import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SearchBarProps {
  onClose?: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onClose, className }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<{ title: string; slug: string; count: number }[]>([]);
  
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Load popular tags
  useEffect(() => {
    const loadPopularTags = async () => {
      try {
        const { data } = await supabase
          .from('tags')
          .select(`
            title,
            slug,
            post_tags(count)
          `)
          .limit(10);

        if (data) {
          const tagsWithCount = data
            .map(tag => ({
              title: tag.title,
              slug: tag.slug,
              count: tag.post_tags?.length || 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
          
          setPopularTags(tagsWithCount);
        }
      } catch (error) {
        console.error('Error loading popular tags:', error);
      }
    };

    loadPopularTags();
  }, []);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          subtitle,
          slug,
          type,
          published_at,
          cover_image_url,
          profiles:author_id (username, avatar_url),
          categories:category_id (title, slug)
        `)
        .eq('status', 'published')
        .or(`title.ilike.%${searchQuery}%, content_html.ilike.%${searchQuery}%`)
        .order('published_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setResults((data as Post[]) || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      // Navigate to search results page
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'story': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'question': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'Статья';
      case 'story': return 'История';
      case 'question': return 'Вопрос';
      default: return type;
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Поиск статей, вопросов..."
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {query.trim().length >= 2 ? (
              // Search Results
              <div>
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Поиск...
                  </div>
                ) : results.length > 0 ? (
                  <div className="divide-y divide-border">
                    {results.map((post) => (
                      <Link
                        key={post.id}
                        to={`/p/${post.slug}`}
                        className="block p-4 hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setIsOpen(false);
                          saveRecentSearch(query);
                          onClose?.();
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          {post.cover_image_url && (
                            <img
                              src={post.cover_image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant="secondary" className={`text-xs ${getTypeColor(post.type)}`}>
                                {getTypeLabel(post.type)}
                              </Badge>
                              {post.categories && (
                                <span className="text-xs text-muted-foreground">
                                  {post.categories.title}
                                </span>
                              )}
                            </div>
                            <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                              {post.title}
                            </h3>
                            {post.subtitle && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {post.subtitle}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {post.profiles?.username}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(post.published_at || post.created_at).toLocaleDateString('ru')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    
                    {results.length === 8 && (
                      <div className="p-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.location.href = `/search?q=${encodeURIComponent(query)}`;
                          }}
                        >
                          Показать все результаты
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Ничего не найдено по запросу "{query}"
                  </div>
                )}
              </div>
            ) : (
              // Default state - recent searches and popular tags
              <div className="p-4 space-y-4">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Недавние поиски
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Очистить
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          className="block w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded px-2 py-1 transition-colors"
                          onClick={() => {
                            setQuery(search);
                            performSearch(search);
                          }}
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Tags */}
                {popularTags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Популярные темы
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {popularTags.map((tag) => (
                        <Link
                          key={tag.slug}
                          to={`/tag/${tag.slug}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-colors"
                          onClick={() => {
                            setIsOpen(false);
                            onClose?.();
                          }}
                        >
                          #{tag.title}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {tag.count}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};