import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Input } from '../components/common/Input.js';
import { Button } from '../components/common/Button.js';
import { Layers, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleQuickDemo = () => {
    setEmail('manager@queueflow.com');
    setPassword('Password123!');
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) newErrors.email = 'Email address is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      await login({ email: email.trim(), password });
      success('Welcome back to QueueFlow!');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-charcoal-900 text-white shadow-subtle mb-4">
          <Layers className="w-6 h-6 text-coral-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-charcoal-900">
          Sign in to Queue<span className="text-coral-500">Flow</span>
        </h2>
        <p className="mt-1 text-xs text-charcoal-600">
          Smart Queue & Customer Flow Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-md border border-border shadow-card">
          {/* Demo Credentials Quick Fill Banner */}
          <div className="mb-6 p-3 bg-coral-50 border border-coral-200/80 rounded flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-coral-800">
              <Zap className="w-4 h-4 text-coral-600 flex-shrink-0" />
              <span>
                Demo: <strong>manager@queueflow.com</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-xs font-semibold text-coral-700 hover:text-coral-900 bg-white px-2 py-1 rounded border border-coral-200 hover:bg-coral-50 transition-colors shadow-subtle"
            >
              Fill Demo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Manager Email Address"
              type="email"
              placeholder="name@organization.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              disabled={isLoading}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Dashboard
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs">
            <span className="text-charcoal-500">Need a manager account?</span>
            <Link
              to="/register"
              className="font-semibold text-coral-600 hover:text-coral-700 transition-colors"
            >
              Register here
            </Link>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-charcoal-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Encrypted JWT Sessions & bcrypt password hashing</span>
        </div>
      </div>
    </div>
  );
};
