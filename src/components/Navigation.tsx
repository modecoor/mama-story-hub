import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { SearchBar } from './SearchBar';
import { 
  Heart, 
  Home, 
  Search, 
  User, 
  LogOut, 
  Settings, 
  PenTool, 
  MessageCircleQuestion,
  Shield,
  Menu,
  X
} from 'lucide-react';

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (email?: string) => {
    if (!email) return 'У';
    return email.charAt(0).toUpperCase();
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
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

        {/* Поиск (десктоп) */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-8">
          <SearchBar />
        </div>

        {/* Десктопная навигация */}
        <div className="hidden md:flex items-center space-x-4">
          {user && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/submit" className="flex items-center space-x-2">
                  <PenTool className="h-4 w-4" />
                  <span>Написать</span>
                </Link>
              </Button>
              
              <Button variant="ghost" size="sm" asChild>
                <Link to="/ask" className="flex items-center space-x-2">
                  <MessageCircleQuestion className="h-4 w-4" />
                  <span>Спросить</span>
                </Link>
              </Button>
            </>
          )}
          
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

        {/* Мобильная навигация */}
        <div className="flex md:hidden items-center space-x-2">
          <ThemeToggle />
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-8">
                {/* Мобильный поиск */}
                <div className="px-1">
                  <SearchBar onClose={closeMobileMenu} />
                </div>
                
                <div className="border-t pt-4">
                  {user ? (
                    <div className="space-y-4">
                      {/* Профиль пользователя */}
                      <div className="flex items-center space-x-3 px-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder.svg" alt="Аватар" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.email}</p>
                          <p className="text-xs text-muted-foreground">Пользователь</p>
                        </div>
                      </div>
                      
                      {/* Навигационные ссылки */}
                      <div className="space-y-2">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          asChild
                          onClick={closeMobileMenu}
                        >
                          <Link to="/">
                            <Home className="mr-3 h-4 w-4" />
                            Главная
                          </Link>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          asChild
                          onClick={closeMobileMenu}
                        >
                          <Link to="/submit">
                            <PenTool className="mr-3 h-4 w-4" />
                            Написать пост
                          </Link>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          asChild
                          onClick={closeMobileMenu}
                        >
                          <Link to="/ask">
                            <MessageCircleQuestion className="mr-3 h-4 w-4" />
                            Задать вопрос
                          </Link>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          asChild
                          onClick={closeMobileMenu}
                        >
                          <Link to="/me">
                            <User className="mr-3 h-4 w-4" />
                            Личный кабинет
                          </Link>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          asChild
                          onClick={closeMobileMenu}
                        >
                          <Link to="/admin">
                            <Shield className="mr-3 h-4 w-4" />
                            Админка
                          </Link>
                        </Button>
                      </div>
                      
                      <div className="border-t pt-4">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-destructive hover:text-destructive" 
                          onClick={() => {
                            handleSignOut();
                            closeMobileMenu();
                          }}
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Выйти
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start" 
                        asChild
                        onClick={closeMobileMenu}
                      >
                        <Link to="/">
                          <Home className="mr-3 h-4 w-4" />
                          Главная
                        </Link>
                      </Button>
                      
                      <Button 
                        className="w-full" 
                        asChild
                        onClick={closeMobileMenu}
                      >
                        <Link to="/auth">Войти</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};