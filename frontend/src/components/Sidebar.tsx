import React from "react"
import {
  LayoutDashboard,
  ShieldCheck,
  FileSpreadsheet,
  Cpu,
  Moon,
  Sun,
  TrendingUp,
  CheckCircle2,
  LogOut
} from "lucide-react"
import { User } from "../lib/types"

export type TabType = "dashboard" | "new_assessment" | "applications" | "model_insights"

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  isDark: boolean
  toggleTheme: () => void
  user?: User | null
  onLogout?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
  user,
  onLogout
}) => {
  const menuItems = [
    {
      id: "dashboard" as TabType,
      label: "Portfolio Overview",
      subtitle: "KPIs & Macro Stress Test",
      icon: LayoutDashboard,
    },
    {
      id: "new_assessment" as TabType,
      label: "New Assessment",
      subtitle: "Instant Underwriting & SHAP",
      icon: ShieldCheck,
      badge: "Real-time"
    },
    {
      id: "applications" as TabType,
      label: "Applications Ledger",
      subtitle: "Audit Log & PDF Export",
      icon: FileSpreadsheet,
    },
    {
      id: "model_insights" as TabType,
      label: "Model Governance",
      subtitle: "Metrics & Fairness Audit",
      icon: Cpu,
    },
  ]

  return (
    <aside className="w-72 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors duration-200 select-none">
      <div>
        {/* Brand Logo & Name */}
        <div className="h-16 px-6 flex items-center border-b border-zinc-100 dark:border-zinc-900 gap-3">
          <div className="w-9 h-9 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
                CreditSense
              </span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                AI Risk
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
              Institutional Credit Platform
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Risk Management
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left transition-all duration-150 group ${
                  isActive
                    ? "bg-black dark:bg-white text-white dark:text-black font-semibold shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive
                        ? "text-white dark:text-black"
                        : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-sm leading-snug">{item.label}</div>
                    <div className={`text-[11px] font-normal truncate ${isActive ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-400 dark:text-zinc-500"}`}>
                      {item.subtitle}
                    </div>
                  </div>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                    isActive
                      ? "bg-zinc-800 text-zinc-200 border-zinc-700 dark:bg-zinc-200 dark:text-zinc-800 dark:border-zinc-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer controls: System Health & Dark Mode */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3">
        <div className="px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white animate-pulse"></span>
              XGBoost Engine
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">v1.2</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Probability Calibration</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-bold">Active</span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
            {isDark ? "Light Interface" : "Dark Interface"}
          </span>
          <span className="text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
            Toggle
          </span>
        </button>

        {user && onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out Session
            </span>
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[80px]">
              {user.username}
            </span>
          </button>
        )}
      </div>
    </aside>
  )
}
