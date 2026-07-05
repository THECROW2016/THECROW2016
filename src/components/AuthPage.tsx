import { useState } from 'react';
import { Activity, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<{ error?: string }>;
  loading?: boolean;
}

export function AuthPage({ onLogin, loading }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const result = await onLogin(email, password);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Hospital System</h1>
          <p className="text-slate-400 mt-2">Sign in to manage your workflow</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-800/50 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                <span className="text-slate-400">Admin:</span>
                <span className="text-cyan-400 font-mono">admin@hospital.com / demo123</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                <span className="text-slate-400">Receptionist:</span>
                <span className="text-cyan-400 font-mono">reception@hospital.com / demo123</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                <span className="text-slate-400">Nurse:</span>
                <span className="text-cyan-400 font-mono">nurse@hospital.com / demo123</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                <span className="text-slate-400">Doctor:</span>
                <span className="text-cyan-400 font-mono">doctor@hospital.com / demo123</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                <span className="text-slate-400">Lab Tech:</span>
                <span className="text-cyan-400 font-mono">lab@hospital.com / demo123</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                <span className="text-slate-400">Pharmacist:</span>
                <span className="text-cyan-400 font-mono">pharmacy@hospital.com / demo123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
