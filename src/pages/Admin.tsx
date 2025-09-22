import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  FileText, 
  MessageCircle,
  Flag,
  TrendingUp,
  BarChart3,
  Settings,
  AlertTriangle,
  Search
} from 'lucide-react';

interface ModerationPost {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'published' | 'rejected';
  created_at: string;
  author_id: string;
  content_html?: string;
  profiles?: {
    username?: string;
    email?: string;
  };
}

interface DashboardStats {
  totalPosts: number;
  pendingPosts: number;
  publishedToday: number;
  totalUsers: number;
  totalReports: number;
  newReports: number;
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    pendingPosts: 0,
    publishedToday: 0,
    totalUsers: 0,
    totalReports: 0,
    newReports: 0
  });
  
  const [pendingPosts, setPendingPosts] = useState<ModerationPost[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<ModerationPost | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Проверка авторизации и прав доступа
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (!profile || !['admin', 'editor'].includes(profile.role)) {
        toast({
          title: 'Доступ запрещен',
          description: 'У вас нет прав для доступа к админке',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }

      setUserProfile(profile);
      fetchDashboardData();
    } catch (error) {
      console.error('Ошибка проверки доступа:', error);
      navigate('/');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Статистика постов
      const { data: postsData } = await supabase
        .from('posts')
        .select('status, created_at');

      const totalPosts = postsData?.length || 0;
      const pendingPosts = postsData?.filter(p => p.status === 'pending').length || 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const publishedToday = postsData?.filter(p => 
        p.status === 'published' && 
        new Date(p.created_at) >= today
      ).length || 0;

      // Статистика пользователей
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id');
      const totalUsers = usersData?.length || 0;

      // Статистика жалоб
      const { data: reportsData } = await supabase
        .from('reports')
        .select('status');
      const totalReports = reportsData?.length || 0;
      const newReports = reportsData?.filter(r => r.status === 'new').length || 0;

      setStats({
        totalPosts,
        pendingPosts,
        publishedToday,
        totalUsers,
        totalReports,
        newReports
      });

      // Получаем посты на модерации
      fetchPendingPosts();
      fetchReports();
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (username, avatar_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingPosts((data || []) as ModerationPost[]);
    } catch (error) {
      console.error('Ошибка загрузки постов на модерации:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          posts (title, slug),
          comments (content_html),
          profiles:user_id (username)
        `)
        .eq('status', 'new')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Ошибка загрузки жалоб:', error);
    }
  };

  const handlePostAction = async (postId: string, action: 'publish' | 'reject') => {
    try {
      const updateData: any = {
        status: action === 'publish' ? 'published' : 'rejected'
      };

      if (action === 'publish') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: action === 'publish' ? 'Пост опубликован' : 'Пост отклонен',
        description: action === 'publish' 
          ? 'Пост успешно опубликован и доступен пользователям'
          : 'Пост отклонен' + (rejectionReason ? `: ${rejectionReason}` : '')
      });

      // Обновляем списки
      fetchDashboardData();
      setSelectedPost(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Ошибка модерации поста:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить действие',
        variant: 'destructive'
      });
    }
  };

  const handleReportAction = async (reportId: string, action: 'reviewed' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: action })
        .eq('id', parseInt(reportId));

      if (error) throw error;

      toast({
        title: action === 'reviewed' ? 'Жалоба рассмотрена' : 'Жалоба отклонена',
        description: 'Статус жалобы обновлен'
      });

      fetchReports();
    } catch (error) {
      console.error('Ошибка обработки жалобы:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обработать жалобу',
        variant: 'destructive'
      });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'story': return 'История';
      case 'question': return 'Вопрос';
      case 'article': return 'Статья';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'story': return 'bg-secondary text-secondary-foreground';
      case 'question': return 'bg-primary text-primary-foreground';
      case 'article': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary mr-3" />
            <div>
              <h1 className="text-3xl font-bold">Админка</h1>
              <p className="text-muted-foreground">
                Модерация и управление контентом
              </p>
            </div>
          </div>
          <Badge variant="secondary">
            {userProfile?.role === 'admin' ? 'Администратор' : 'Редактор'}
          </Badge>
        </div>

        {/* Статистика */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-8">
          <Card className="card-soft">
            <CardContent className="pt-6 text-center">
              <FileText className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <div className="text-sm text-muted-foreground">Всего постов</div>
            </CardContent>
          </Card>
          
          <Card className="card-soft">
            <CardContent className="pt-6 text-center">
              <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.pendingPosts}</div>
              <div className="text-sm text-muted-foreground">На модерации</div>
            </CardContent>
          </Card>
          
          <Card className="card-soft">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.publishedToday}</div>
              <div className="text-sm text-muted-foreground">Опубликовано сегодня</div>
            </CardContent>
          </Card>
          
          <Card className="card-soft">
            <CardContent className="pt-6 text-center">
              <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">Пользователей</div>
            </CardContent>
          </Card>
          
          <Card className="card-soft">
            <CardContent className="pt-6 text-center">
              <Flag className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalReports}</div>
              <div className="text-sm text-muted-foreground">Всего жалоб</div>
            </CardContent>
          </Card>
          
          <Card className="card-soft">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.newReports}</div>
              <div className="text-sm text-muted-foreground">Новых жалоб</div>
            </CardContent>
          </Card>
        </div>

        {/* Основной контент */}
        <Tabs defaultValue="moderation" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Модерация</span>
              {stats.pendingPosts > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {stats.pendingPosts}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Жалобы</span>
              {stats.newReports > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {stats.newReports}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Аналитика</span>
            </TabsTrigger>
          </TabsList>

          {/* Модерация */}
          <TabsContent value="moderation" className="mt-6">
            <Card className="card-soft">
              <CardHeader>
                <CardTitle>Посты на модерации</CardTitle>
                <CardDescription>
                  Рассмотрите и одобрите или отклоните публикации пользователей
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingPosts.length > 0 ? (
                  <div className="space-y-4">
                    {pendingPosts.map((post) => (
                      <div key={post.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getTypeColor(post.type)}>
                                {getTypeLabel(post.type)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                от {post.profiles?.username || 'Аноним'}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(post.created_at).toLocaleDateString('ru')}
                              </span>
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                            {post.content_html && (
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {post.content_html.replace(/<[^>]*>/g, '').substring(0, 200)}...
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>{post.title}</DialogTitle>
                                  <DialogDescription>
                                    Предпросмотр поста от {post.profiles?.username || 'Аноним'}
                                  </DialogDescription>
                                </DialogHeader>
                                <div 
                                  className="content-prose mt-4"
                                  dangerouslySetInnerHTML={{ 
                                    __html: post.content_html || '' 
                                  }}
                                />
                                <DialogFooter className="gap-2">
                                  <Button
                                    onClick={() => handlePostAction(post.id, 'publish')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Опубликовать
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="destructive">
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Отклонить
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                      <DialogHeader>
                                        <DialogTitle>Отклонить пост</DialogTitle>
                                        <DialogDescription>
                                          Укажите причину отклонения (необязательно)
                                        </DialogDescription>
                                      </DialogHeader>
                                      <Textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Причина отклонения..."
                                        rows={3}
                                      />
                                      <DialogFooter>
                                        <Button
                                          variant="destructive"
                                          onClick={() => handlePostAction(post.id, 'reject')}
                                        >
                                          Отклонить
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              onClick={() => handlePostAction(post.id, 'publish')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Отклонить пост</DialogTitle>
                                  <DialogDescription>
                                    Укажите причину отклонения
                                  </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Причина отклонения..."
                                  rows={3}
                                />
                                <DialogFooter>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handlePostAction(post.id, 'reject')}
                                  >
                                    Отклонить
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Нет постов на модерации</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Жалобы */}
          <TabsContent value="reports" className="mt-6">
            <Card className="card-soft">
              <CardHeader>
                <CardTitle>Жалобы пользователей</CardTitle>
                <CardDescription>
                  Рассмотрите жалобы на посты и комментарии
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="destructive">Жалоба</Badge>
                              <span className="text-sm text-muted-foreground">
                                от {report.profiles?.username || 'Аноним'}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(report.created_at).toLocaleDateString('ru')}
                              </span>
                            </div>
                            
                            {report.posts && (
                              <h4 className="font-medium mb-1">
                                Пост: {report.posts.title}
                              </h4>
                            )}
                            
                            {report.comments && (
                              <h4 className="font-medium mb-1">
                                Комментарий: {report.comments.content_html.replace(/<[^>]*>/g, '').substring(0, 100)}...
                              </h4>
                            )}
                            
                            <p className="text-sm text-muted-foreground">
                              Причина: {report.reason}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              onClick={() => handleReportAction(report.id, 'reviewed')}
                              size="sm"
                              variant="default"
                            >
                              Рассмотрено
                            </Button>
                            <Button
                              onClick={() => handleReportAction(report.id, 'dismissed')}
                              size="sm"
                              variant="outline"
                            >
                              Отклонить
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Нет новых жалоб</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Аналитика */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="card-soft">
                <CardHeader>
                  <CardTitle>Активность контента</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Опубликованных постов</span>
                    <span className="font-bold">{stats.totalPosts - stats.pendingPosts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ожидают модерации</span>
                    <span className="font-bold text-yellow-600">{stats.pendingPosts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Опубликовано сегодня</span>
                    <span className="font-bold text-green-600">{stats.publishedToday}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-soft">
                <CardHeader>
                  <CardTitle>Пользователи и жалобы</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Всего пользователей</span>
                    <span className="font-bold">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Всего жалоб</span>
                    <span className="font-bold">{stats.totalReports}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Новых жалоб</span>
                    <span className="font-bold text-red-600">{stats.newReports}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;