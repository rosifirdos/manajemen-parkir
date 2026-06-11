"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  mqttStatus: string;
}

export default function Navbar({ mqttStatus }: NavbarProps) {
  const pathname = usePathname();

  const isConnected = mqttStatus.toLowerCase().includes("connected");

  const navItems = [
    { href: "/", label: "Dashboard", icon: "📡" },
    { href: "/analytics", label: "Analytics", icon: "📊" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-black">
              P
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-none">
                SMART PARKING
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 align-top">
                  PRO
                </span>
              </h1>
              <p className="text-[10px] text-[var(--text-muted)] font-medium tracking-wider uppercase">
                Garis Awan • AIoT System
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-[var(--accent-indigo-dim)] text-indigo-400 border border-indigo-500/20"
                        : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card-hover)]"
                    }
                  `}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <div
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
                ${
                  isConnected
                    ? "bg-[var(--accent-emerald-dim)] text-emerald-400 border-emerald-500/20"
                    : "bg-[var(--accent-red-dim)] text-red-400 border-red-500/20"
                }
              `}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-red-400"
                }`}
              />
              {isConnected ? "Live" : "Offline"}
            </div>

            {/* Mobile nav */}
            <div className="sm:hidden flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      p-2 rounded-lg text-lg transition-all
                      ${isActive ? "bg-[var(--accent-indigo-dim)]" : ""}
                    `}
                  >
                    {item.icon}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
