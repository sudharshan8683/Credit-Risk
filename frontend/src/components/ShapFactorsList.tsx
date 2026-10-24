import React from "react"
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react"
import { ShapFactor } from "../lib/types"

interface ShapFactorsListProps {
  factors: ShapFactor[]
}

export const ShapFactorsList: React.FC<ShapFactorsListProps> = ({ factors }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Key ML Drivers (SHAP Value Attribution)
        </h4>
        <span className="text-[11px] text-slate-400">
          Ordered by predictive influence
        </span>
      </div>

      <div className="space-y-2.5">
        {factors.map((f, i) => {
          const isRaise = f.direction === "raises_risk"
          return (
            <div
              key={f.feature + i}
              className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                      isRaise
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    {isRaise ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {f.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      isRaise
                        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                        : "bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {isRaise ? "Increases Risk" : "Reduces Risk"}
                  </span>
                  <span className="text-xs font-semibold font-mono text-zinc-500 dark:text-zinc-400">
                    {f.impact_score}%
                  </span>
                </div>
              </div>

              {/* Relative Weight Bar */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isRaise ? "bg-black dark:bg-white" : "bg-zinc-500 dark:bg-zinc-400"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, f.impact_score))}%` }}
                />
              </div>

              {/* Plain English Banking Explanation */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {f.sentence}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
