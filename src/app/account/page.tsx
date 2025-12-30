import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Mock data - replace with real API calls
  const stats = {
    activeListings: 3,
    pendingPayouts: 125.50,
    totalEarnings: 1847.25,
    itemsSold: 12,
  };

  const recentActivity = [
    { id: '1', type: 'sale', item: '1921 Morgan Dollar MS-63', amount: 79, date: '2024-01-15' },
    { id: '2', type: 'payout', item: 'Bank Transfer', amount: 245.50, date: '2024-01-14' },
    { id: '3', type: 'listing', item: 'Peace Dollar AU-58', amount: null, date: '2024-01-12' },
    { id: '4', type: 'sale', item: 'Charizard Base Set PSA 7', amount: 450, date: '2024-01-10' },
  ];

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">Welcome back, {session.user.name || 'Collector'}</p>
          </div>
          <div className="flex items-center gap-4">
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-12 h-12 rounded-full"
              />
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Active Listings</p>
            <p className="text-2xl font-bold text-white">{stats.activeListings}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Pending Payouts</p>
            <p className="text-2xl font-bold text-emerald-400">${stats.pendingPayouts.toFixed(2)}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Items Sold</p>
            <p className="text-2xl font-bold text-white">{stats.itemsSold}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Total Earnings</p>
            <p className="text-2xl font-bold text-emerald-400">${stats.totalEarnings.toFixed(2)}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/scan"
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl p-4 text-center transition"
          >
            <span className="text-2xl block mb-2">📸</span>
            <span className="font-medium">Scan Item</span>
          </Link>
          <Link
            href="/account/collection"
            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-4 text-center transition"
          >
            <span className="text-2xl block mb-2">📁</span>
            <span className="font-medium">My Collection</span>
          </Link>
          <Link
            href="/account/submissions"
            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-4 text-center transition"
          >
            <span className="text-2xl block mb-2">📦</span>
            <span className="font-medium">Submissions</span>
          </Link>
          <Link
            href="/account/payouts"
            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-4 text-center transition"
          >
            <span className="text-2xl block mb-2">💰</span>
            <span className="font-medium">Payouts</span>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'sale' ? 'bg-emerald-500/20' :
                    activity.type === 'payout' ? 'bg-blue-500/20' :
                    'bg-slate-700'
                  }`}>
                    <span>
                      {activity.type === 'sale' ? '💵' :
                       activity.type === 'payout' ? '🏦' : '📝'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{activity.item}</p>
                    <p className="text-slate-400 text-sm capitalize">{activity.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <p className={`font-medium ${
                      activity.type === 'payout' ? 'text-blue-400' : 'text-emerald-400'
                    }`}>
                      {activity.type === 'payout' ? '-' : '+'}${activity.amount.toFixed(2)}
                    </p>
                  )}
                  <p className="text-slate-500 text-sm">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
