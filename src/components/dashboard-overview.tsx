import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Book, Volume2, Image, TrendingUp, TrendingDown, LayoutDashboard, BookOpen, Calendar, Presentation } from 'lucide-react';
import { useState, useEffect } from 'react';
import { userService, bookService, audioService, wallpaperService, calendarService, slideService } from '../services';

// Mock data for charts
const userGrowthData = [
  { month: 'Jan', users: 120 },
  { month: 'Feb', users: 180 },
  { month: 'Mar', users: 240 },
  { month: 'Apr', users: 310 },
  { month: 'May', users: 380 },
  { month: 'Jun', users: 450 }
];

const topBooksData = [
  { title: 'Premchand Stories', reads: 850 },
  { title: 'Shakespeare Plays', reads: 720 },
  { title: 'Hindi Poetry', reads: 650 },
  { title: 'English Grammar', reads: 580 },
  { title: 'Modern Literature', reads: 520 }
];

export function DashboardOverview() {
  const [stats, setStats] = useState([
    {
      title: "Total Users",
      value: "0",
      change: "+0%",
      icon: Users,
      isPositive: true
    },
    {
      title: "Hindi Books",
      value: "0",
      change: "+0%",
      icon: Book,
      isPositive: true
    },
    {
      title: "English Books",
      value: "0",
      change: "+0%",
      icon: Book,
      isPositive: true
    },
    {
      title: "Audio Files",
      value: "0",
      change: "+0%",
      icon: Volume2,
      isPositive: true
    },
    {
      title: "Wallpapers",
      value: "0",
      change: "+0%",
      icon: Image,
      isPositive: true
    },
    {
      title: "Calendar Events",
      value: "0",
      change: "+0%",
      icon: Calendar,
      isPositive: true
    },
    {
      title: "Slides",
      value: "0",
      change: "+0%",
      icon: Presentation,
      isPositive: true
    }
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load all data in parallel
        const [usersResult, booksResult, audioResult, wallpapersResult, eventsResult, slidesResult] = await Promise.all([
          userService.getUsers(),
          bookService.getBooks(),
          audioService.getAudioContent(),
          wallpaperService.getWallpapers(),
          calendarService.getEvents(),
          slideService.getSlides({ limit: 1000 })
        ]);

        const hindiBooks = booksResult.success ? booksResult.data.filter((book: any) => book.language === 'hindi').length : 0;
        const englishBooks = booksResult.success ? booksResult.data.filter((book: any) => book.language === 'english').length : 0;
        const totalUsers = usersResult.success ? usersResult.data.length : 0;
        const totalAudio = audioResult.success ? audioResult.data.length : 0;
        const totalWallpapers = wallpapersResult.success ? wallpapersResult.data.length : 0;
        const totalEvents = eventsResult.success ? eventsResult.data.length : 0;
        const totalSlides = slidesResult.success ? slidesResult.data.length : 0;

        setStats([
          {
            title: "Total Users",
            value: totalUsers.toLocaleString(),
            change: "+12.5%",
            icon: Users,
            isPositive: true
          },
          {
            title: "Hindi Books",
            value: hindiBooks.toString(),
            change: "+3.2%",
            icon: Book,
            isPositive: true
          },
          {
            title: "English Books",
            value: englishBooks.toString(),
            change: "+5.1%",
            icon: Book,
            isPositive: true
          },
          {
            title: "Audio Files",
            value: totalAudio.toLocaleString(),
            change: "+8.7%",
            icon: Volume2,
            isPositive: true
          },
          {
            title: "Wallpapers",
            value: totalWallpapers.toString(),
            change: "+2.1%",
            icon: Image,
            isPositive: true
          },
          {
            title: "Calendar Events",
            value: totalEvents.toString(),
            change: "+15.3%",
            icon: Calendar,
            isPositive: true
          },
          {
            title: "Slides",
            value: totalSlides.toString(),
            change: "+7.8%",
            icon: Presentation,
            isPositive: true
          }
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-orange-600/10 rounded-3xl p-8 border border-orange-200/40">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
              <p className="text-orange-600 font-medium">Here's what's happening with your content today</p>
            </div>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
            Monitor your content performance, manage users, and track analytics across all your content libraries. 
            All pages are now fully functional with Firebase integration!
          </p>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-orange-700/20 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-orange-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</CardTitle>
                <div className="p-3 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl group-hover:from-orange-500/20 group-hover:to-orange-600/20 transition-all duration-300">
                  <stat.icon className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative pt-0">
              <div className="text-3xl font-bold text-gray-900 mb-3">{stat.value}</div>
              <div className={`text-sm flex items-center gap-2 font-medium ${
                stat.isPositive ? 'text-green-600' : 'text-red-500'
              }`}>
                <div className={`p-1 rounded-full ${
                  stat.isPositive ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {stat.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </div>
                {/* <span>{stat.change}</span>
                <span className="text-gray-500 font-normal">vs last month</span> */}
              </div>
            </CardContent>
            
            {/* Hover effect bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-6 bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
                  User Growth Trend
                </CardTitle>
                <p className="text-gray-600 mt-1">Monthly active users progression</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-xl">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" strokeOpacity={0.6} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#78716c' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#78716c' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #fed7aa', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="url(#gradient)" 
                  strokeWidth={4}
                  dot={{ fill: '#f97316', strokeWidth: 3, r: 6, stroke: 'white' }}
                  activeDot={{ r: 8, stroke: '#f97316', strokeWidth: 2, fill: 'white' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-6 bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
                  Popular Content
                </CardTitle>
                <p className="text-gray-600 mt-1">Top performing books this month</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-xl">
                <BookOpen className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topBooksData} layout="horizontal" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" strokeOpacity={0.6} />
                <XAxis 
                  type="number" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#78716c' }}
                />
                <YAxis 
                  dataKey="title" 
                  type="category" 
                  width={110}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#78716c' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #fed7aa', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }} 
                />
                <Bar 
                  dataKey="reads" 
                  fill="url(#barGradient)" 
                  radius={[0, 8, 8, 0]}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}