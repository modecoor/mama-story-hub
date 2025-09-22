import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/hooks/usePosts';
import { PostCard } from '@/components/PostCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Settings, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Bookmark,
  PenTool,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface UserStats {
  totalPosts: number;
  publishedPosts: number;
  pendingPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalBookmarks: number;
}

interface ProfileData {
  username?: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  interests?: string[];
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalPosts: 0,
    publishedPosts: 0,
    pendingPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalBookmarks: 0
  });
  const [loading, setLoading] = useState(true);

  // Получаем посты пользователя по статусам
  const draftPosts = usePosts({ authorId: user?.id, status: 'draft' });
  const pendingPosts = usePosts({ authorId: user?.id, status: 'pending' });
  const publishedPosts = usePosts({ authorId: user?.id, status: 'published' });
  const rejectedPosts = usePosts({ authorId: user?.id, status: 'rejected' });

  // Проверка авторизации
  if (!user) {
    navigate('/auth');
    return null;
  }

  useEffect(() => {
    fetchProfileData();
    fetchUserStats();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfileData(profile);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные профиля',
        variant: 'destructive'
      });
    }
  };

  const fetchUserStats = async () => {
    try {
      setLoading(true);

      // Статистика постов
      const { data: postsStats, error: postsError } = await supabase
        .from('posts')
        .select('id, status')
        .eq('author_id', user.id);

      if (postsError) throw postsError;

      const totalPosts = postsStats?.length || 0;
      const publishedPosts = postsStats?.filter(p => p.status === 'published').length || 0;
      const pendingPosts = postsStats?.filter(p => p.status === 'pending').length || 0;

      // Статистика сигналов (просмотры, лайки и т.д.)
      const { data: signalsStats, error: signalsError } = await supabase
        .from('signals')
        .select('type, post_id')
        .in('post_id', postsStats?.map(p => p.id) || []);

      if (signalsError) throw signalsError;

      const totalViews = signalsStats?.filter(s => s.type === 'view').length || 0;
      const totalLikes = signalsStats?.filter(s => s.type === 'like').length || 0;
      const totalBookmarks = signalsStats?.filter(s => s.type === 'bookmark').length || 0;

      // Статистика комментариев
      const { data: commentsStats, error: commentsError } = await supabase
        .from('comments')
        .select('id')
        .in('post_id', postsStats?.map(p => p.id) || [])
        .eq('status', 'visible');

      if (commentsError) throw commentsError;

      const totalComments = commentsStats?.length || 0;

      setStats({
        totalPosts,
        publishedPosts,
        pendingPosts,
        totalViews,
        totalLikes,
        totalComments,
        totalBookmarks
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Опубликовано';
      case 'pending': return 'На модерации';
      case 'rejected': return 'Отклонено';
      case 'draft': return 'Черновик';
      default: return status;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'editor': return 'Редактор';
      case 'author': return 'Автор';
      case 'user': return 'Пользователь';
      default: return role;
    }
  };

  const PostsList = ({ posts, loading, error }: { posts: any[], loading: boolean, error: string | null }) => {
    if (loading) {
      return <div className="text-center py-8 text-muted-foreground">Загрузка...</div>;
    }

    if (error) {
      return <div className="text-center py-8 text-destructive">Ошибка: {error}</div>;
    }

    if (posts.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">Постов пока нет</div>;
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <User className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold">Личный кабинет</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/me/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Профиль */}
          <div className="lg:col-span-1">
            <Card className="card-soft">
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={profileData?.avatar_url} alt="Аватар" />
                  <AvatarFallback className="text-2xl">
                    {profileData?.username?.charAt(0) || user.email?.charAt(0) || 'У'}
                  </AvatarFallback>
                </Avatar>
                
                <CardTitle>{profileData?.username || 'Аноним'}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                
                <Badge variant="secondary" className="mt-2">
                  {getRoleLabel(profileData?.role || 'user')}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {profileData?.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">О себе</h4>
                    <p className="text-sm text-muted-foreground">{profileData.bio}</p>
                  </div>
                )}
                
                {profileData?.interests && profileData.interests.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Интересы</h4>
                    <div className="flex flex-wrap gap-1">
                      {profileData.interests.map((interest, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Участник с {new Date(profileData?.created_at || '').toLocaleDateString('ru')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Быстрые действия */}
            <Card className="card-soft mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <a href="/submit">
                    <PenTool className="h-4 w-4 mr-2" />
                    Написать историю
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href="/ask">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Задать вопрос
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Основной контент */}
          <div className="lg:col-span-2">
            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="card-soft">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-xl font-bold">{stats.totalPosts}</div>
                  <div className="text-sm text-muted-foreground">Постов</div>
                </CardContent>
              </Card>
              
              <Card className="card-soft">
                <CardContent className="pt-6 text-center">
                  <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-xl font-bold">{stats.totalViews}</div>
                  <div className="text-sm text-muted-foreground">Просмотров</div>
                </CardContent>
              </Card>
              
              <Card className="card-soft">
                <CardContent className="pt-6 text-center">
                  <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <div className="text-xl font-bold">{stats.totalLikes}</div>
                  <div className="text-sm text-muted-foreground">Лайков</div>
                </CardContent>
              </Card>
              
              <Card className="card-soft">
                <CardContent className="pt-6 text-center">
                  <MessageCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <div className="text-xl font-bold">{stats.totalComments}</div>
                  <div className="text-sm text-muted-foreground">Комментариев</div>
                </CardContent>
              </Card>
            </div>

            {/* Прогресс */}
            {stats.totalPosts > 0 && (
              <Card className="card-soft mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Активность
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Опубликованных постов</span>
                      <span>{stats.publishedPosts} из {stats.totalPosts}</span>
                    </div>
                    <Progress value={(stats.publishedPosts / stats.totalPosts) * 100} />
                  </div>
                  
                  {stats.totalViews > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Вовлеченность читателей</span>
                        <span>{Math.round((stats.totalLikes + stats.totalComments) / stats.totalViews * 100)}%</span>
                      </div>
                      <Progress value={(stats.totalLikes + stats.totalComments) / stats.totalViews * 100} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Табы с постами */}
            <Tabs defaultValue="published" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="published" className="flex items-center gap-2">
                  {getStatusIcon('published')}
                  <span className="hidden sm:inline">Опубликованные</span>
                  <span className="sm:hidden">Опубл.</span>
                  {stats.publishedPosts > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {stats.publishedPosts}
                    </Badge>
                  )}
                </TabsTrigger>
                
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  {getStatusIcon('pending')}
                  <span className="hidden sm:inline">На модерации</span>
                  <span className="sm:hidden">Модер.</span>
                  {pendingPosts.posts.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {pendingPosts.posts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                
                <TabsTrigger value="draft" className="flex items-center gap-2">
                  {getStatusIcon('draft')}
                  <span className="hidden sm:inline">Черновики</span>
                  <span className="sm:hidden">Черн.</span>
                  {draftPosts.posts.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {draftPosts.posts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                
                <TabsTrigger value="rejected" className="flex items-center gap-2">
                  {getStatusIcon('rejected')}
                  <span className="hidden sm:inline">Отклоненные</span>
                  <span className="sm:hidden">Откл.</span>
                  {rejectedPosts.posts.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {rejectedPosts.posts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="published" className="mt-6">
                <PostsList 
                  posts={publishedPosts.posts} 
                  loading={publishedPosts.loading} 
                  error={publishedPosts.error} 
                />
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Эти посты ожидают проверки модераторами и будут опубликованы после одобрения.
                  </p>
                </div>
                <PostsList 
                  posts={pendingPosts.posts} 
                  loading={pendingPosts.loading} 
                  error={pendingPosts.error} 
                />
              </TabsContent>

              <TabsContent value="draft" className="mt-6">
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Черновики сохраняются автоматически. Завершите их редактирование для отправки на модерацию.
                  </p>
                </div>
                <PostsList 
                  posts={draftPosts.posts} 
                  loading={draftPosts.loading} 
                  error={draftPosts.error} 
                />
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <XCircle className="h-4 w-4 inline mr-1" />
                    Эти посты не прошли модерацию. Вы можете отредактировать их и отправить повторно.
                  </p>
                </div>
                <PostsList 
                  posts={rejectedPosts.posts} 
                  loading={rejectedPosts.loading} 
                  error={rejectedPosts.error} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;