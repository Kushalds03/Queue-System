import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { authApi } from '../services/api.js';
import { Card } from '../components/common/Card.js';
import { Input } from '../components/common/Input.js';
import { Button } from '../components/common/Button.js';
import {
  User,
  Building,
  Key,
  Volume2,
  Database,
  ShieldCheck,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error, info } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('queueflow_sound') !== 'false';
  });

  // Test Audio Chime
  const testChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.85);
      info('Audio chime sounded');
    } catch (e) {
      console.warn('Audio test failed:', e);
    }
  };

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('queueflow_sound', String(enabled));
    if (enabled) {
      testChime();
    }
  };

  // Update Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Name cannot be empty');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const res = await authApi.updateProfile({
        name: name.trim(),
        organization: organization.trim() || undefined,
      });

      if (res.success && res.user) {
        updateUser(res.user);
        success('Profile updated successfully!');
      }
    } catch (err: any) {
      error(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Update Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      error('Current password is required');
      return;
    }
    if (newPassword.length < 6) {
      error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await authApi.updateProfile({
        currentPassword,
        newPassword,
      });
      success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 tracking-tight">
          System & Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
          Manage your manager profile, security credentials, and audio preferences
        </p>
      </div>

      {/* 1. Manager Profile Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border">
          <div className="w-8 h-8 rounded bg-coral-50 text-coral-600 border border-coral-200/80 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-charcoal-900">Manager Profile</h2>
            <p className="text-[11px] text-charcoal-500">
              Personal and business details associated with this account
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Manager Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              disabled={isUpdatingProfile}
            />

            <Input
              label="Organization / Business Name"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Central Metro Hospital"
              disabled={isUpdatingProfile}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-charcoal-700 tracking-wide uppercase">
              Registered Email (Primary Identity)
            </label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full bg-canvas-subtle border border-border text-charcoal-500 text-sm rounded px-3 py-2 cursor-not-allowed font-mono"
            />
            <span className="text-[11px] text-charcoal-400">
              Email addresses cannot be modified directly for audit log compliance.
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isUpdatingProfile}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Security & Password Management */}
      <Card className="p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border">
          <div className="w-8 h-8 rounded bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-charcoal-900">Change Password</h2>
            <p className="text-[11px] text-charcoal-500">
              Update your account password using bcrypt-secured authentication
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePassword} className="mt-5 space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isUpdatingPassword}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password (min 6 chars)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isUpdatingPassword}
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isUpdatingPassword}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="secondary"
              size="md"
              isLoading={isUpdatingPassword}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Audio & Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border">
          <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-charcoal-900">Sound & Counter Alerts</h2>
            <p className="text-[11px] text-charcoal-500">
              Synthesized audio chime tone whenever a customer is called to counter
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-charcoal-900 block">
              Audible Chime on "Call Next"
            </span>
            <span className="text-xs text-charcoal-500">
              Plays an attention-getting dual-tone chime when dispatching tickets.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={testChime}>
              Test Sound
            </Button>

            <button
              type="button"
              onClick={() => handleToggleSound(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                soundEnabled ? 'bg-coral-500' : 'bg-charcoal-300'
              }`}
              role="switch"
              aria-checked={soundEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* 4. Deployment Readiness & Database Status */}
      <Card className="p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border">
          <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-charcoal-900">Database & Deployment Architecture</h2>
            <p className="text-[11px] text-charcoal-500">
              Target configuration for Vercel (Frontend), Render (Backend), and Neon (PostgreSQL)
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-canvas-subtle rounded border border-border">
            <span className="font-bold text-charcoal-900 block mb-0.5">Frontend Target</span>
            <span className="text-charcoal-600">Vercel (React 18 + Vite + TS)</span>
            <span className="mt-2 block text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Production Ready
            </span>
          </div>

          <div className="p-3 bg-canvas-subtle rounded border border-border">
            <span className="font-bold text-charcoal-900 block mb-0.5">Backend Target</span>
            <span className="text-charcoal-600">Render (Node.js + Express API)</span>
            <span className="mt-2 block text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Production Ready
            </span>
          </div>

          <div className="p-3 bg-canvas-subtle rounded border border-border">
            <span className="font-bold text-charcoal-900 block mb-0.5">Database Target</span>
            <span className="text-charcoal-600">Neon (PostgreSQL + Prisma ORM)</span>
            <span className="mt-2 block text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Schema Synced
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
