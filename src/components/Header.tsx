'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const navLinks = [
  { href: '/shop', label: 'Shop', icon: '🛒' },
  { href: '/scan', label: 'Scan', icon: '📷' },
  { href: '/sell', label: 'Sell', icon: '💰' },
];

const accountLinks = [
  { href: '/account', label: 'Dashboard' },
  { href: '/account/submissions', label: 'My Submissions' },
  { href: '/account/payouts', label: 'Payouts' },
  { href: '/account/settings', label: 'Settings' },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              Kollekt<span className="text-emerald-400">IQ</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* User Menu (Desktop) */}
            {session?.user ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-7 h-7 rounded-full ring-2 ring-slate-700"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                      {session.user.name?.[0] || 'U'}
                    </div>
                  )}
                  <span className="max-w-[100px] truncate">{session.user.name || 'Account'}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-2 z-50">
                    {accountLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block px-4 py-2 text-sm transition ${
                          pathname === link.href
                            ? 'text-emerald-400 bg-slate-700/50'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <div className="border-t border-slate-700 my-2" />
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:block px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {/* Nav Links */}
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}

            <div className="border-t border-slate-800 my-4" />

            {/* Account Links (Mobile) */}
            {session?.user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2">
                  {session.user.image ? (
                    <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                      {session.user.name?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium text-sm">{session.user.name}</p>
                    <p className="text-slate-400 text-xs">{session.user.email}</p>
                  </div>
                </div>
                {accountLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition ${
                      pathname === link.href
                        ? 'bg-slate-800 text-emerald-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 transition"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block px-4 py-3 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white text-center transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
