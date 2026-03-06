"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import dynamic from "next/dynamic";

const Blockie = dynamic(() => import("./Blockie"), { ssr: false });

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/view_events", label: "Events" },
  { href: "/create_event", label: "Create Event" },
];

const WALLET_LINKS = [
  { href: "/event_tickets", label: "My Tickets" },
  { href: "/view_created_events", label: "Created Events" },
];

export default function Navbar() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [avatar, setAvatar] = useState("");

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { authenticated, login, logout } = usePrivy();

  const displayAddress = address;
  const shortAddr = displayAddress
    ? `${displayAddress.slice(0, 6)}…${displayAddress.slice(-4)}`
    : "Connected";

  /* Scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Blockie avatar */
  useEffect(() => {
    if (!displayAddress) return;
    import("ethereum-blockies").then((m) => {
      const canvas = m.default.create({
        seed: displayAddress.toLowerCase(),
        size: 8,
        scale: 4,
      });
      setAvatar(canvas.toDataURL());
    });
  }, [displayAddress]);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMobileOpen(false);
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setWalletOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Close on route change */
  useEffect(() => {
    setMobileOpen(false);
    setWalletOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    if (isConnected) disconnect();
    logout();
  };

  return (
    <>
      <style>{`

        :root {
          --ec-bg:      #020617;
          --ec-surface: #0F172A;
          --ec-s2:      #1E293B;
          --ec-border:  rgba(53,208,127,0.12);
          --ec-green:   #35D07F;
          --ec-cyan:    #22D3EE;
          --ec-text:    #F8FAFC;
          --ec-muted:   rgba(248,250,252,0.45);
          --ec-dimmed:  rgba(248,250,252,0.18);
        }

        .nav-root {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          font-family: var(--ec-font-body);
          transition: background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          border-bottom: 1px solid transparent;
        }
        .nav-root.scrolled {
          background: rgba(2,6,23,0.88);
          backdrop-filter: blur(20px) saturate(1.5);
          border-bottom-color: rgba(53,208,127,0.1);
          box-shadow: 0 4px 32px rgba(0,0,0,0.4);
        }
        .nav-root:not(.scrolled) {
          background: rgba(2,6,23,0.6);
          backdrop-filter: blur(12px);
        }

        .nav-inner {
          max-width: 1400px; margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
        }

        /* Logo */
        .nav-logo {
          font-family: var(--ec-font-display);
          font-size: 20px; font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, var(--ec-green) 0%, var(--ec-cyan) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          text-decoration: none; flex-shrink: 0;
          transition: opacity 0.2s;
        }
        .nav-logo:hover { opacity: 0.85; }

        /* Desktop nav links */
        .nav-links {
          display: flex; align-items: center; gap: 4px;
        }
        @media (max-width: 768px) { .nav-links { display: none; } }

        .nav-link {
          position: relative;
          padding: 7px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          color: var(--ec-muted); text-decoration: none;
          transition: color 0.2s, background 0.2s;
        }
        .nav-link:hover { color: var(--ec-text); background: rgba(248,250,252,0.05); }
        .nav-link.active {
          color: var(--ec-green);
          background: rgba(53,208,127,0.08);
        }
        .nav-link.active::after {
          content: '';
          position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
          width: 16px; height: 2px;
          background: var(--ec-green); border-radius: 2px;
        }

        /* Right cluster */
        .nav-right { display: flex; align-items: center; gap: 10px; }

        /* Login button */
        .nav-login-btn {
          padding: 8px 20px;
          background: linear-gradient(135deg, var(--ec-green), #28b86d);
          border: none; border-radius: 10px; cursor: pointer;
          font-family: var(--ec-font-body); font-size: 13px; font-weight: 600;
          color: #020617; transition: all 0.25s ease;
        }
        .nav-login-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(53,208,127,0.28); }

        /* Wallet pill */
        .nav-wallet-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 12px 6px 6px;
          background: var(--ec-surface);
          border: 1px solid var(--ec-border);
          border-radius: 100px; cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .nav-wallet-btn:hover {
          border-color: rgba(53,208,127,0.3);
          background: rgba(53,208,127,0.05);
        }
        .nav-wallet-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          border: 1px solid rgba(53,208,127,0.3); overflow: hidden;
          background: var(--ec-s2); flex-shrink: 0;
        }
        .nav-wallet-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .nav-wallet-addr {
          font-size: 12px; font-weight: 600; color: var(--ec-text);
          letter-spacing: 0.02em;
        }
        .nav-wallet-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--ec-green);
          animation: nw-pulse 2s infinite;
        }
        @keyframes nw-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(53,208,127,0.5); }
          50%      { box-shadow: 0 0 0 4px rgba(53,208,127,0); }
        }
        .nav-chevron {
          width: 14px; height: 14px; stroke: var(--ec-dimmed); fill: none;
          transition: transform 0.25s;
        }
        .nav-chevron.open { transform: rotate(180deg); }

        /* Dropdown */
        .nav-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 210px;
          background: var(--ec-surface);
          border: 1px solid var(--ec-border);
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(53,208,127,0.08);
          animation: nd-in 0.18s cubic-bezier(0.16,1,0.3,1);
          z-index: 200;
        }
        @keyframes nd-in { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

        .nd-section { padding: 6px; }
        .nd-section + .nd-section { border-top: 1px solid rgba(53,208,127,0.07); }

        .nd-label {
          font-size: 10px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--ec-dimmed);
          padding: 8px 10px 4px;
        }

        .nd-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          color: var(--ec-muted); text-decoration: none;
          transition: background 0.15s, color 0.15s;
          cursor: pointer; border: none; background: none; width: 100%; text-align: left;
        }
        .nd-item:hover { background: rgba(53,208,127,0.07); color: var(--ec-text); }
        .nd-item.logout { color: #f87171; }
        .nd-item.logout:hover { background: rgba(239,68,68,0.08); color: #fca5a5; }
        .nd-item svg { width: 15px; height: 15px; stroke: currentColor; fill: none; flex-shrink: 0; }

        /* Hamburger */
        .nav-hamburger {
          display: none; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 10px;
          background: var(--ec-surface); border: 1px solid var(--ec-border);
          cursor: pointer; transition: border-color 0.2s;
        }
        @media (max-width: 768px) { .nav-hamburger { display: flex; } }
        .nav-hamburger:hover { border-color: rgba(53,208,127,0.3); }
        .nav-hamburger svg { width: 18px; height: 18px; stroke: var(--ec-muted); fill: none; }

        /* Mobile menu */
        .nav-mobile {
          position: absolute; top: 100%; left: 0; right: 0;
          background: rgba(9,15,35,0.98); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(53,208,127,0.1);
          padding: 16px 20px 20px;
          display: flex; flex-direction: column; gap: 4px;
          animation: nm-in 0.22s cubic-bezier(0.16,1,0.3,1);
          z-index: 99;
        }
        @keyframes nm-in { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }

        .nm-link {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; border-radius: 11px;
          font-size: 14px; font-weight: 500;
          color: var(--ec-muted); text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .nm-link:hover { background: rgba(53,208,127,0.07); color: var(--ec-text); }
        .nm-link.active { background: rgba(53,208,127,0.1); color: var(--ec-green); }
        .nm-link svg { width: 16px; height: 16px; stroke: currentColor; fill: none; flex-shrink: 0; }

        .nm-divider { height: 1px; background: rgba(53,208,127,0.07); margin: 8px 0; }

        .nm-logout {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; border-radius: 11px;
          font-size: 14px; font-weight: 500; color: #f87171;
          background: none; border: none; cursor: pointer; width: 100%; text-align: left;
          transition: background 0.15s;
        }
        .nm-logout:hover { background: rgba(239,68,68,0.08); }
        .nm-logout svg { width: 16px; height: 16px; stroke: currentColor; fill: none; }
      `}</style>

      <nav className={`nav-root${scrolled ? " scrolled" : ""}`} ref={menuRef}>
        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            EventChain
          </Link>

          {/* Desktop nav */}
          <div className="nav-links">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link${pathname === href ? " active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right cluster */}
          <div className="nav-right">
            {/* Authenticated → wallet pill */}
            {authenticated && (
              <div style={{ position: "relative" }} ref={dropRef}>
                <button
                  className="nav-wallet-btn"
                  onClick={() => setWalletOpen((o) => !o)}
                  aria-label="Wallet menu"
                >
                  <div className="nav-wallet-avatar">
                    {avatar && <img src={avatar} alt="avatar" />}
                  </div>
                  <span className="nav-wallet-addr">{shortAddr}</span>
                  <div className="nav-wallet-dot" />
                  <svg
                    className={`nav-chevron${walletOpen ? " open" : ""}`}
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {walletOpen && (
                  <div className="nav-dropdown">
                    <div className="nd-section">
                      <div className="nd-label">Account</div>
                      {WALLET_LINKS.map(({ href, label }) => (
                        <Link key={href} href={href} className="nd-item">
                          <svg viewBox="0 0 24 24" strokeWidth="2">
                            {href === "/event_tickets" ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            )}
                          </svg>
                          {label}
                        </Link>
                      ))}
                    </div>
                    <div className="nd-section">
                      <button className="nd-item logout" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" strokeWidth="2">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Not authenticated → login */}
            {!authenticated && (
              <button className="nav-login-btn" onClick={login}>
                Login with Privy
              </button>
            )}

            {/* Hamburger (mobile) */}
            <button
              className="nav-hamburger"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg viewBox="0 0 24 24" strokeWidth="2.5">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" strokeWidth="2.5">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="nav-mobile">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nm-link${pathname === href ? " active" : ""}`}
              >
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  {href === "/" && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  )}
                  {href === "/view_events" && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  )}
                  {href === "/create_event" && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  )}
                </svg>
                {label}
              </Link>
            ))}

            {authenticated && (
              <>
                <div className="nm-divider" />
                {WALLET_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`nm-link${pathname === href ? " active" : ""}`}
                  >
                    <svg viewBox="0 0 24 24" strokeWidth="2">
                      {href === "/event_tickets" ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      )}
                    </svg>
                    {label}
                  </Link>
                ))}
                <div className="nm-divider" />
                <button className="nm-logout" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </>
            )}

            {!authenticated && (
              <>
                <div className="nm-divider" />
                <button
                  className="nav-login-btn"
                  style={{ width: "100%", borderRadius: 11 }}
                  onClick={login}
                >
                  Login with Privy
                </button>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
