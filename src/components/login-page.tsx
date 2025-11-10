import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BookOpen, Lock, Mail, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<boolean>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onLogin({ email, password });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-300 rounded-full opacity-15"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-100 rounded-full opacity-10"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
             
          <img
  src="https://res.cloudinary.com/dyltyzwo6/image/upload/v1761489634/Ellipse_1_kx2ntt.png"
  alt="Cover"
  className="h-18 w-18 rounded-md object-cover"
/>

 
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Connect With Swami Sivananda</h1>
          <p className="text-muted-foreground">Swami Sivananda to spread and share his divine wisdom</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your admin account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 rounded border border-input bg-background accent-primary"
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo credentials info */}
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-200">
              <p className="text-sm font-semibold text-orange-700 text-center mb-3">
                🎯 Demo Credentials
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-white/60 rounded-lg">
                  <p className="font-semibold text-gray-700">Admin Account:</p>
                  <p className="text-gray-600">Email: admin@demo.com</p>
                  <p className="text-gray-600">Password: demo123</p>
                </div>
                {/* <div className="p-2 bg-white/60 rounded-lg">
                  <p className="font-semibold text-gray-700">User Account:</p>
                  <p className="text-gray-600">Email: user@demo.com</p>
                  <p className="text-gray-600">Password: demo123</p>
                </div> */}
              </div>
              <p className="text-xs text-orange-600 text-center mt-3">
                These work without Firebase connection
              </p>
            </div>

            {/* Firebase setup info */}
            <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                <strong>For Production:</strong> Configure Firebase in /lib/firebase.ts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2025 CMS Admin. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}