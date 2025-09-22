import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserCheck, UserX, Shield, User, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UserProfile {
  id: string;
  user_id: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const AdminUsersList = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Ошибка загрузки пользователей:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список пользователей',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, role: newRole }
          : user
      ));

      toast({
        title: 'Успешно!',
        description: `Роль пользователя изменена на ${getRoleLabel(newRole)}`
      });

    } catch (error: any) {
      console.error('Ошибка изменения роли:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить роль пользователя',
        variant: 'destructive'
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'editor': return 'Редактор';
      case 'user': return 'Пользователь';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'editor': return <Shield className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'editor': return 'secondary';
      case 'user': return 'outline';
      default: return 'outline';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getInitials = (username?: string) => {
    if (!username) return 'У';
    return username.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Загрузка пользователей...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserCheck className="h-5 w-5" />
          <span>Управление пользователями</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Фильтры */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Роль" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все роли</SelectItem>
              <SelectItem value="user">Пользователи</SelectItem>
              <SelectItem value="editor">Редакторы</SelectItem>
              <SelectItem value="admin">Админы</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchUsers} variant="outline">
            Обновить
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm text-muted-foreground">Всего</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'user').length}
            </div>
            <div className="text-sm text-muted-foreground">Пользователи</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'editor').length}
            </div>
            <div className="text-sm text-muted-foreground">Редакторы</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-muted-foreground">Админы</div>
          </div>
        </div>

        {/* Список пользователей */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Пользователи не найдены</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">
                        {user.username || 'Без имени'}
                      </p>
                      <Badge 
                        variant={getRoleBadgeVariant(user.role)}
                        className="flex items-center space-x-1"
                      >
                        {getRoleIcon(user.role)}
                        <span>{getRoleLabel(user.role)}</span>
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      ID: {user.user_id.slice(0, 8)}...
                    </p>
                    
                    <p className="text-xs text-muted-foreground">
                      Регистрация: {formatDistanceToNow(new Date(user.created_at), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </p>
                    
                    {user.bio && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Select
                    value={user.role}
                    onValueChange={(newRole) => updateUserRole(user.user_id, newRole)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Пользователь</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="editor">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Редактор</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-4 w-4" />
                          <span>Админ</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredUsers.length > 0 && (
          <div className="mt-6 text-sm text-muted-foreground text-center">
            Показано {filteredUsers.length} из {users.length} пользователей
          </div>
        )}
      </CardContent>
    </Card>
  );
};