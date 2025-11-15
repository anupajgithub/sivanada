import { useState } from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { LoginPage } from './components/login-page';
import { DashboardOverview } from './components/dashboard-overview';
import { UsersManagement } from './components/users-management';
import { BooksManagement } from './components/books-management';
import { AudioManagement } from './components/audio-management';
import { AIAudioManagement } from './components/ai-audio-management';
import { WallpapersManagement } from './components/wallpapers-management';
import { CalendarManagement } from './components/calendar-management';
import { SlideManagement } from './components/slide-management';
import { LayoutDashboard, Users, BookOpen, Volume2, Image, Calendar, Presentation, Menu, LogOut, User, Bot } from 'lucide-react';
import { Button } from './components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { toast } from 'sonner@2.0.3';

export default function App() {
  const { user, loading, isAuthenticated, signIn, signOut } = useFirebaseAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleLogin = async (credentials: { email: string; password: string }) => {
    const result = await signIn(credentials.email, credentials.password);
    if (!result.success) {
      toast.error(result.error || 'Login failed');
      return false;
    }
    toast.success('Login successful!');
    return true;
  };

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      setActiveSection('dashboard');
      toast.success('Logged out successfully');
    } else {
      toast.error(result.error || 'Logout failed');
    }
  };

  // Show loading spinner while initializing auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50/80 via-white to-orange-50/50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Overview & Analytics',
      icon: LayoutDashboard,
      component: DashboardOverview
    },
    {
      id: 'users',
      title: 'Users',
      description: 'User Management',
      icon: Users,
      component: UsersManagement
    },
    {
      id: 'books',
      title: 'connect with divine wisdom',
      description: 'Content Management',
      icon: BookOpen,
      component: BooksManagement
    },
    {
      id: 'audio',
      title: 'talks & bhjans',
      description: 'Audio Library',
      icon: Volume2,
      component: AudioManagement
    },
    {
      id: 'ai-audio',
      title: 'AI Audio',
      description: 'AI Generated Audio',
      icon: Bot,
      component: AIAudioManagement
    },
    {
      id: 'wallpapers',
      title: 'Wallpapers',
      description: 'Media Gallery',
      icon: Image,
      component: WallpapersManagement
    },
    {
      id: 'calendar',
      title: 'Calendar',
      description: 'Events & Schedules',
      icon: Calendar,
      component: CalendarManagement
    },
    {
      id: 'slides',
      title: 'Slides',
      description: 'Content Slides',
      icon: Presentation,
      component: SlideManagement
    }
  ];

  const ActiveComponent = menuItems.find(item => item.id === activeSection)?.component || DashboardOverview;

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-orange-50/80 via-white to-orange-50/50">
      {/* Custom Sidebar */}
      <aside className="w-72 bg-white/95 backdrop-blur-xl border-r border-orange-200/60 shadow-xl">
        {/* Sidebar Header */}
        <div className="h-20 px-6 flex items-center border-b border-orange-200/40 bg-gradient-to-r from-orange-500/5 to-orange-600/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h2 className="font-bold text-xl text-gray-900">CMS Admin</h2>
              <p className="text-xs text-orange-600 font-medium">Content Management</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-2 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                activeSection === item.id
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 transform scale-[1.02]'
                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 px-4 py-2">
                <div className={`relative ${
                  activeSection === item.id
                    ? 'text-white'
                    : 'text-orange-500 group-hover:text-orange-600'
                }`}>
                  <item.icon className="h-6 w-6" />
                  {activeSection === item.id && (
                    <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse"></div>
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className={`font-semibold ${
                    activeSection === item.id ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.title}
                  </div>
                  <div className={`text-xs ${
                    activeSection === item.id 
                      ? 'text-orange-100' 
                      : 'text-gray-500 group-hover:text-orange-600'
                  }`}>
                    {item.description}
                  </div>
                </div>
                {activeSection === item.id && (
                  <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                )}
              </div>
              
              {/* Active indicator */}
              {activeSection === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-orange-50/50 to-transparent">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-orange-200/40">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-orange-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">System Online</span>
              </div>
              <p className="text-xs text-gray-500">© 2025 Sivanada.com - Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-orange-200/40 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                {(() => {
                  const currentItem = menuItems.find(item => item.id === activeSection);
                  const IconComponent = currentItem?.icon;
                  return IconComponent ? <IconComponent className="h-4 w-4 text-white" /> : null;
                })()}
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900">
                  {menuItems.find(item => item.id === activeSection)?.title}
                </h1>
                <p className="text-sm text-orange-600">
                  {menuItems.find(item => item.id === activeSection)?.description}
                </p>
              </div>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-orange-50/50 rounded-full px-4 py-2 border border-orange-200/40">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700 font-medium">System Healthy</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-2 border-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-transparent text-white font-bold">
                      {user?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 mt-2 border-orange-200/40 shadow-xl" align="end" forceMount>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100/50">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold">
                      {user?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-sm text-orange-600 truncate">{user?.email}</p>
                    <p className="text-xs text-gray-500">{user?.role || 'Administrator'}</p>
                  </div>
                </div>
                <div className="p-1">
                  {/* <DropdownMenuItem className="cursor-pointer rounded-lg gap-3 p-3 hover:bg-orange-50">
                    <User className="h-4 w-4 text-orange-500" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem> */}
                  <DropdownMenuItem 
                    className="cursor-pointer rounded-lg gap-3 p-3 text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl mx-auto">
            <ActiveComponent />
          </div>
        </div>
      </main>
    </div>
  );
}