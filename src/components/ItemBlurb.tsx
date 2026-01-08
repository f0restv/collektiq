'use client';

import type { ItemIdentification, GradeEstimate } from '@/types/valuation';

interface ItemBlurbProps {
  blurb: string;
  identification: ItemIdentification;
  grade?: GradeEstimate;
}

const CATEGORY_ICONS: Record<string, string> = {
  'pokemon': '⚡',
  'sports-card': '🏆',
  'coin': '🪙',
  'currency': '💵',
  'memorabilia': '🏅',
  'other': '✨'
};

const CATEGORY_COLORS: Record<string, string> = {
  'pokemon': 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  'sports-card': 'from-blue-500/20 to-purple-500/20 border-blue-500/30',
  'coin': 'from-amber-500/20 to-yellow-600/20 border-amber-500/30',
  'currency': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  'memorabilia': 'from-red-500/20 to-pink-500/20 border-red-500/30',
  'other': 'from-slate-500/20 to-slate-600/20 border-slate-500/30'
};

export function ItemBlurb({ blurb, identification, grade }: ItemBlurbProps) {
  const category = identification.category || 'other';
  const icon = CATEGORY_ICONS[category] || '✨';
  const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

  // Build title
  const titleParts: string[] = [];
  if (identification.year) titleParts.push(identification.year.toString());
  titleParts.push(identification.name);

  // Build subtitle with variant info
  const subtitleParts: string[] = [];
  if (identification.set) subtitleParts.push(identification.set);
  if (identification.variant) subtitleParts.push(identification.variant);
  if (identification.cardNumber) subtitleParts.push(`#${identification.cardNumber}`);
  if (identification.mint) subtitleParts.push(`${identification.mint} Mint`);
  if (identification.denomination) subtitleParts.push(identification.denomination);

  return (
    <div className={`bg-gradient-to-br ${colorClass} border rounded-lg p-5`}>
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div className="text-4xl flex-shrink-0">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-xl font-bold text-white leading-tight">
            {titleParts.join(' ')}
          </h3>

          {/* Subtitle / Details */}
          {subtitleParts.length > 0 && (
            <p className="text-slate-300 text-sm mt-1">
              {subtitleParts.join(' • ')}
            </p>
          )}

          {/* Grade Badge */}
          {grade && (
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-slate-700/80 text-white">
                {grade.estimate}
              </span>
              {grade.confidence && (
                <span className="text-xs text-slate-400">
                  {Math.round(grade.confidence * 100)}% confidence
                </span>
              )}
            </div>
          )}

          {/* Blurb */}
          <p className="text-slate-200 mt-3 leading-relaxed">
            {blurb}
          </p>

          {/* Additional metadata tags */}
          {(identification.manufacturer || identification.certService) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {identification.manufacturer && (
                <span className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-300">
                  {identification.manufacturer}
                </span>
              )}
              {identification.certService && identification.certNumber && (
                <span className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-300">
                  {identification.certService} #{identification.certNumber}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemBlurb;
