import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Input } from '../components/common/Input.js';
import { Button } from '../components/common/Button.js';
import { Layers, ArrowRight, Check } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});

  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string | undefined } = {};

    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Valid email is required';
    if (!password || password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        organization: organization.trim() || undefined,
      });
      success('Manager account registered successfully! Initial queue prepared.');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-charcoal-900 text-white shadow-subtle mb-4">
          <Layers className="w-6 h-6 text-coral-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-charcoal-900">
          Create Manager Account
        </h2>
        <p className="mt-1 text-xs text-charcoal-600">
          Start streamlining customer flow in minutes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-md border border-border shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Manager Full Name *"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              error={errors.name}
              disabled={isLoading}
              autoFocus
            />

            <Input
              label="Organization / Business Name"
              placeholder="e.g. Metro Health, City Bank, Tech Hub"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              disabled={isLoading}
              helperText="Shown on customer tickets & queues"
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="manager@organization.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              disabled={isLoading}
              autoComplete="email"
            />

            <Input
              label="Password (min 6 chars) *"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              disabled={isLoading}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs">
            <span className="text-charcoal-500">Already registered?</span>
            <Link
              to="/login"
              className="font-semibold text-coral-600 hover:text-coral-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

