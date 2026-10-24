import React from "react"
import { Shield, Building2, LogOut } from "lucide-react"
import { User } from "../lib/types"

interface HeaderProps {
  title: string
  subtitle: string
  user?: User | null
  onLogout?: () => void
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, user, onLogout }) => {
  const getInitials = (name?: string) => {
    if (!name) return "LO"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <header className="h-16 px-8 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-white leading-tight">
          {title}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Compliance Guardrails Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <Shield className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
          <span>Fair Lending Protected</span>
        </div>

        {/* Currency & Market Identifier */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200">
          <Building2 className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
          <span>Market: India (INR ₹)</span>
        </div>

        {/* User Underwriter Avatar & Sign Out */}
        {user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-bold shadow-xs">
                {getInitials(user.full_name)}
              </div>
              <div className="hidden md:block text-left text-xs leading-tight">
                <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {user.full_name}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {user.role}
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign out of CreditSense"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </header>
  )
}
