import Link from 'next/link';

const footerLinks = {
  shop: [
    { href: '/shop/coins', label: 'Coins' },
    { href: '/shop/currency', label: 'Currency' },
    { href: '/shop/sports-card', label: 'Sports Cards' },
    { href: '/shop/pokemon', label: 'Pokemon' },
  ],
  sell: [
    { href: '/sell', label: 'Sell With Us' },
    { href: '/scan', label: 'Get a Quote' },
    { href: 'mailto:bulk@collektiq.com', label: 'Bulk Sales' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/faq', label: 'FAQ' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-white">
                Kollekt<span className="text-emerald-400">IQ</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm">
              AI-powered identification, grading, and pricing for coins, cards, and collectibles.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-emerald-400 text-sm transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h4 className="text-white font-semibold mb-4">Sell</h4>
            <ul className="space-y-2">
              {footerLinks.sell.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-emerald-400 text-sm transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-emerald-400 text-sm transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} KollektIQ. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-slate-500 hover:text-slate-400 text-sm transition">
              Privacy
            </Link>
            <Link href="/terms" className="text-slate-500 hover:text-slate-400 text-sm transition">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
