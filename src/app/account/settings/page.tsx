'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [notifications, setNotifications] = useState({
    sales: true,
    payouts: true,
    marketing: false,
    priceAlerts: true,
  });

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-slate-900 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-800 rounded w-1/3" />
            <div className="h-64 bg-slate-800 rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // TODO: Implement profile update API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/account"
            className="text-slate-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Section */}
        <section className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6">Profile</h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-16 h-16 rounded-full ring-2 ring-slate-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
                  {session?.user?.name?.[0] || 'U'}
                </div>
              )}
              <div>
                <p className="text-white font-medium">{session?.user?.name}</p>
                <p className="text-slate-400 text-sm">{session?.user?.email}</p>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-slate-500 text-sm mt-1">
                Used for notifications and account recovery
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Notifications Section */}
        <section className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6">Notifications</h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Sale Notifications</p>
                <p className="text-slate-400 text-sm">Get notified when your items sell</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.sales}
                onChange={() => handleNotificationChange('sales')}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Payout Notifications</p>
                <p className="text-slate-400 text-sm">Get notified when payouts are processed</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.payouts}
                onChange={() => handleNotificationChange('payouts')}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Price Alerts</p>
                <p className="text-slate-400 text-sm">Get notified about price changes on watched items</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.priceAlerts}
                onChange={() => handleNotificationChange('priceAlerts')}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Marketing Emails</p>
                <p className="text-slate-400 text-sm">Receive updates about new features and promotions</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.marketing}
                onChange={() => handleNotificationChange('marketing')}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
              />
            </label>
          </div>
        </section>

        {/* Payment Methods Section */}
        <section className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6">Payment Methods</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏦</span>
                <div>
                  <p className="text-white font-medium">Bank Account</p>
                  <p className="text-slate-400 text-sm">••••4567</p>
                </div>
              </div>
              <span className="text-emerald-400 text-sm font-medium">Primary</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💳</span>
                <div>
                  <p className="text-white font-medium">PayPal</p>
                  <p className="text-slate-400 text-sm">user@example.com</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-white text-sm transition">
                Make Primary
              </button>
            </div>

            <button className="w-full p-4 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition">
              + Add Payment Method
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-6">Danger Zone</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Sign Out</p>
                <p className="text-slate-400 text-sm">Sign out of your account on this device</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Sign Out
              </button>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Delete Account</p>
                  <p className="text-slate-400 text-sm">Permanently delete your account and all data</p>
                </div>
                <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
