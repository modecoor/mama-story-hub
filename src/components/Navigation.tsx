import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { 
  Heart, 
  Home, 
  Search, 
  User, 
  LogOut, 
  Settings, 
  PenTool, 
  MessageCircleQuestion,
  Shield 
} from 'lucide-react';

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (email?: string) => {
    if (!email) return 'У';
    return email.charAt(0).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Логотип */}
        <Link to="/" className="flex items-center space-x-2">
          <Heart className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            МамПространство
          </span>
        </Link>

        {/* Основная навигация */}
        <div className="hidden md:flex items-center space-x-6">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Главная</span>
          </Link>
          
          <Link 
            to="/search" 
            className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Поиск</span>
          </Link>

          {user && (
            <>
              <Link 
                to="/submit" 
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <PenTool className="h-4 w-4" />
                <span>Написать</span>
              </Link>
              
              <Link 
                to="/ask" 
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircleQuestion className="h-4 w-4" />
                <span>Вопрос</span>
              </Link>
            </>
          )}
        </div>

        {/* Правая часть навигации */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder.svg" alt="Аватар" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Пользователь</p>
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link to="/me" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Личный кабинет</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link to="/me/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Настройки</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Админка</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default">
              <Link to="/auth">Войти</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};