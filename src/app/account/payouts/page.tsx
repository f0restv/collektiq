import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';

type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface Payout {
  id: string;
  amount: number;
  status: PayoutStatus;
  method: 'bank' | 'paypal' | 'check';
  items: { name: string; amount: number }[];
  requestedAt: string;
  completedAt?: string;
  reference?: string;
}

const statusColors: Record<PayoutStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/20 text-red-400',
};

const methodIcons: Record<string, string> = {
  bank: '🏦',
  paypal: '💳',
  check: '📝',
};

export default async function PayoutsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Mock data - replace with real API calls
  const payouts: Payout[] = [
    {
      id: 'pay_001',
      amount: 245.50,
      status: 'completed',
      method: 'bank',
      items: [
        { name: '1921 Morgan Dollar MS-63', amount: 70.00 },
        { name: '2023 Topps Chrome Mike Trout', amount: 110.00 },
        { name: 'Peace Dollar AU-58', amount: 65.50 },
      ],
      requestedAt: '2024-01-12T10:00:00Z',
      completedAt: '2024-01-14T15:30:00Z',
      reference: 'ACH-2024011400123',
    },
    {
      id: 'pay_002',
      amount: 125.50,
      status: 'pending',
      method: 'bank',
      items: [
        { name: '$5 Silver Certificate 1934', amount: 55.00 },
        { name: '1923 Peace Dollar', amount: 70.50 },
      ],
      requestedAt: '2024-01-15T08:00:00Z',
    },
    {
      id: 'pay_003',
      amount: 450.00,
      status: 'completed',
      method: 'paypal',
      items: [
        { name: 'Charizard Base Set PSA 7', amount: 450.00 },
      ],
      requestedAt: '2024-01-08T14:00:00Z',
      completedAt: '2024-01-09T10:00:00Z',
      reference: 'PP-9XY123456',
    },
    {
      id: 'pay_004',
      amount: 180.00,
      status: 'processing',
      method: 'bank',
      items: [
        { name: '1878-CC Morgan Dollar', amount: 180.00 },
      ],
      requestedAt: '2024-01-15T12:00:00Z',
    },
  ];

  const pendingAmount = payouts
    .filter((p) => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payouts
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const thisMonth = payouts
    .filter((p) => {
      const date = new Date(p.completedAt || p.requestedAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/account" className="text-emerald-400 hover:text-emerald-300 text-sm mb-2 inline-block">
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Payout History</h1>
          </div>
          <button
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition"
          >
            Payment Settings
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">${pendingAmount.toFixed(2)}</p>
            <p className="text-slate-400 text-sm">Pending</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">${thisMonth.toFixed(2)}</p>
            <p className="text-slate-400 text-sm">This Month</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">${totalPaid.toFixed(2)}</p>
            <p className="text-slate-400 text-sm">All Time</p>
          </div>
        </div>

        {/* Payouts List */}
        <div className="space-y-4">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="bg-slate-800 rounded-xl p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-xl">{methodIcons[payout.method]}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      ${payout.amount.toFixed(2)}
                    </p>
                    <p className="text-slate-400 text-sm capitalize">
                      {payout.method === 'bank' ? 'Bank Transfer' :
                       payout.method === 'paypal' ? 'PayPal' : 'Check'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${statusColors[payout.status]}`}>
                  {payout.status}
                </span>
              </div>

              {/* Items */}
              <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                <p className="text-slate-400 text-xs mb-2">Items Included:</p>
                <div className="space-y-1">
                  {payout.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-white">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-400">
                  {payout.status === 'completed' ? (
                    <>Completed {new Date(payout.completedAt!).toLocaleDateString()}</>
                  ) : (
                    <>Requested {new Date(payout.requestedAt).toLocaleDateString()}</>
                  )}
                </div>
                {payout.reference && (
                  <div className="text-slate-500 font-mono text-xs">
                    Ref: {payout.reference}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {payouts.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400 mb-4">No payouts yet</p>
            <p className="text-slate-500 text-sm">
              Payouts are automatically processed when your items sell.
            </p>
          </div>
        )}

        {/* Payment Method Info */}
        <div className="mt-8 bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Payment Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-300">Bank account ending in ****4567 (Primary)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">○</span>
              <span className="text-slate-400">PayPal: user@email.com</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-4">
            Payouts are processed within 24 hours of item delivery confirmation.
            Bank transfers typically arrive in 2-3 business days.
          </p>
        </div>
      </div>
    </main>
  );
}
