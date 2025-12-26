import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';

type SubmissionStatus = 'pending' | 'approved' | 'listed' | 'sold' | 'declined' | 'shipped';

interface Submission {
  id: string;
  itemName: string;
  category: string;
  status: SubmissionStatus;
  desiredPayout: number;
  approvedPayout?: number;
  listedPrice?: number;
  soldPrice?: number;
  submittedAt: string;
  updatedAt: string;
  image: string;
  trackingNumber?: string;
}

const statusColors: Record<SubmissionStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-blue-500/20 text-blue-400',
  listed: 'bg-purple-500/20 text-purple-400',
  sold: 'bg-emerald-500/20 text-emerald-400',
  declined: 'bg-red-500/20 text-red-400',
  shipped: 'bg-cyan-500/20 text-cyan-400',
};

const statusLabels: Record<SubmissionStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  listed: 'Listed for Sale',
  sold: 'Sold',
  declined: 'Declined',
  shipped: 'Shipped to Buyer',
};

export default async function SubmissionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Mock data - replace with real API calls
  const submissions: Submission[] = [
    {
      id: 'sub_001',
      itemName: '1921 Morgan Silver Dollar',
      category: 'coin',
      status: 'listed',
      desiredPayout: 65,
      approvedPayout: 70,
      listedPrice: 89,
      submittedAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-12T14:30:00Z',
      image: '/images/morgan-1921.jpg',
    },
    {
      id: 'sub_002',
      itemName: '2023 Topps Chrome Mike Trout',
      category: 'sports-card',
      status: 'sold',
      desiredPayout: 100,
      approvedPayout: 110,
      listedPrice: 140,
      soldPrice: 135,
      submittedAt: '2024-01-05T08:00:00Z',
      updatedAt: '2024-01-14T16:00:00Z',
      image: '/images/trout-chrome.jpg',
    },
    {
      id: 'sub_003',
      itemName: 'Charizard Base Set Holo',
      category: 'pokemon',
      status: 'pending',
      desiredPayout: 400,
      submittedAt: '2024-01-15T12:00:00Z',
      updatedAt: '2024-01-15T12:00:00Z',
      image: '/images/charizard-base.jpg',
    },
    {
      id: 'sub_004',
      itemName: '1878-CC Morgan Dollar',
      category: 'coin',
      status: 'approved',
      desiredPayout: 200,
      approvedPayout: 180,
      submittedAt: '2024-01-14T09:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
      image: '/images/morgan-1878cc.jpg',
    },
    {
      id: 'sub_005',
      itemName: '$5 Silver Certificate 1934',
      category: 'currency',
      status: 'shipped',
      desiredPayout: 50,
      approvedPayout: 55,
      listedPrice: 75,
      soldPrice: 72,
      submittedAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-13T09:00:00Z',
      image: '/images/silver-cert.jpg',
      trackingNumber: '1Z999AA10123456784',
    },
  ];

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const activeCount = submissions.filter((s) => ['approved', 'listed'].includes(s.status)).length;
  const soldCount = submissions.filter((s) => ['sold', 'shipped'].includes(s.status)).length;

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/account" className="text-emerald-400 hover:text-emerald-300 text-sm mb-2 inline-block">
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">My Submissions</h1>
          </div>
          <Link
            href="/scan"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition"
          >
            + New Submission
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            <p className="text-slate-400 text-sm">Pending</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{activeCount}</p>
            <p className="text-slate-400 text-sm">Active</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{soldCount}</p>
            <p className="text-slate-400 text-sm">Sold</p>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-slate-800 rounded-xl p-4 flex gap-4"
            >
              {/* Image */}
              <div className="w-20 h-20 bg-slate-700 rounded-lg flex-shrink-0 flex items-center justify-center">
                <span className="text-3xl">
                  {submission.category === 'coin' ? '🪙' :
                   submission.category === 'currency' ? '💵' :
                   submission.category === 'sports-card' ? '🏈' :
                   submission.category === 'pokemon' ? '⚡' : '📦'}
                </span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-white font-medium truncate">{submission.itemName}</h3>
                    <p className="text-slate-400 text-sm">
                      Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusColors[submission.status]}`}>
                    {statusLabels[submission.status]}
                  </span>
                </div>

                {/* Pricing Info */}
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Requested:</span>{' '}
                    <span className="text-white">${submission.desiredPayout}</span>
                  </div>
                  {submission.approvedPayout && (
                    <div>
                      <span className="text-slate-500">Approved:</span>{' '}
                      <span className="text-emerald-400">${submission.approvedPayout}</span>
                    </div>
                  )}
                  {submission.listedPrice && (
                    <div>
                      <span className="text-slate-500">Listed:</span>{' '}
                      <span className="text-purple-400">${submission.listedPrice}</span>
                    </div>
                  )}
                  {submission.soldPrice && (
                    <div>
                      <span className="text-slate-500">Sold:</span>{' '}
                      <span className="text-emerald-400">${submission.soldPrice}</span>
                    </div>
                  )}
                </div>

                {/* Tracking */}
                {submission.trackingNumber && (
                  <div className="mt-2">
                    <a
                      href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${submission.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      Track Package &rarr;
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {submissions.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400 mb-4">No submissions yet</p>
            <Link
              href="/scan"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition"
            >
              Submit Your First Item
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
