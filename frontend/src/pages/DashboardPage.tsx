import React, { useState, useEffect } from "react"
import {
  Users,
  CheckCircle,
  Award,
  AlertOctagon,
  Sliders,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Flame,
  ArrowRight
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts"
import { PortfolioStatsResponse, StressTestResponse } from "../lib/types"
import { fetchPortfolioStats, runStressTest } from "../lib/api"
import { formatPercent } from "../lib/utils"

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<PortfolioStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stress Test state
  const [incomeShock, setIncomeShock] = useState<number>(-15)
  const [rateRiseBps, setRateRiseBps] = useState<number>(200)
  const [unemploymentRise, setUnemploymentRise] = useState<number>(4.0)
  const [stressLoading, setStressLoading] = useState(false)
  const [stressResult, setStressResult] = useState<StressTestResponse | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchPortfolioStats()
      setStats(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load portfolio stats")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRunStressTest = async () => {
    try {
      setStressLoading(true)
      const res = await runStressTest({
        income_shock_pct: incomeShock,
        interest_rate_rise_bps: rateRiseBps,
        unemployment_rise_pct: unemploymentRise
      })
      setStressResult(res)
    } catch (err: any) {
      alert("Stress test simulation failed: " + err.message)
    } finally {
      setStressLoading(false)
    }
  }

  // Run initial stress test automatically once stats are loaded
  useEffect(() => {
    if (stats && !stressResult) {
      handleRunStressTest()
    }
  }, [stats])

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading portfolio risk analytics...</span>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 text-sm">
          Failed to load portfolio data. Please ensure backend server is running.
        </div>
      </div>
    )
  }

  const { kpis, risk_band_distribution, score_distribution, timeline } = stats

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Portfolio Risk Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time underwriting telemetry, credit band distributions, and macroeconomic capital stress testing.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Applications</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {kpis.total_applications.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 flex items-center gap-1">
            <span className="text-zinc-900 dark:text-zinc-100 font-bold">+18%</span>
            <span>from previous quarter</span>
          </div>
        </div>

        {/* Approval Rate */}
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Approval Rate</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {formatPercent(kpis.approval_rate)}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            Within Basel II target corridor (65-75%)
          </div>
        </div>

        {/* Average Credit Score */}
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Credit Score</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {kpis.average_credit_score}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            Prime Band (Healthy borrower mix)
          </div>
        </div>

        {/* Expected Default Rate */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Expected Default Rate</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatPercent(kpis.expected_default_rate)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Calibrated 1-year cumulative loss provision
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Band Distribution (Donut Chart) */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Risk Band Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Underwriting allocation across risk tiers
          </p>

          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={risk_band_distribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {risk_band_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} loans`, `${name}`]}
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#F8FAFC",
                    fontSize: "12px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {risk_band_distribution.map((b) => (
              <div key={b.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                  {b.name}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {b.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Score Distribution (Histogram) */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Credit Score Buckets
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Frequency distribution across 300-850 scale
          </p>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="range" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} applications`, "Count"]}
                  contentStyle={{
                    backgroundColor: "#000000",
                    borderColor: "#27272A",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "12px"
                  }}
                />
                <Bar dataKey="count" fill="#A1A1AA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approvals vs Rejections Over Time */}
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
            Underwriting Trends Over Time
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            Monthly volume of approved vs rejected applications
          </p>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000",
                    borderColor: "#27272A",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "12px"
                  }}
                />
                <Area type="monotone" dataKey="approved" stackId="1" stroke="#FFFFFF" fill="#FFFFFF" fillOpacity={0.3} name="Approved" />
                <Area type="monotone" dataKey="manual_review" stackId="1" stroke="#A1A1AA" fill="#A1A1AA" fillOpacity={0.3} name="Manual Review" />
                <Area type="monotone" dataKey="rejected" stackId="1" stroke="#52525B" fill="#52525B" fillOpacity={0.3} name="Rejected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* HIGHLIGHT: Macroeconomic Stress Testing Panel */}
      <div className="p-6 rounded-2xl bg-zinc-950 text-white border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-800">
                <Sliders className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold tracking-tight text-white">
                Macroeconomic Capital Stress Testing Simulation
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Simulate systemic macroeconomic shocks across the entire borrower portfolio to identify emerging vulnerabilities, assess capital adequacy, and prevent widespread balance sheet distress.
            </p>
          </div>

          <button
            onClick={handleRunStressTest}
            disabled={stressLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-bold transition-all shadow-md shrink-0"
          >
            {stressLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Flame className="w-4 h-4 text-black" />
            )}
            <span>{stressLoading ? "Simulating Shocks..." : "Run Stress Test"}</span>
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-800">
          {/* Income Shock Slider */}
          <div className="space-y-2 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Income Shock</span>
              <span className="font-mono font-bold text-red-400 text-sm">
                {incomeShock}%
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="0"
              step="1"
              value={incomeShock}
              onChange={(e) => setIncomeShock(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-30% (Severe)</span>
              <span>-15% (Moderate)</span>
              <span>0% (Baseline)</span>
            </div>
          </div>

          {/* Interest Rate Rise Slider */}
          <div className="space-y-2 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Policy Rate Rise</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                +{rateRiseBps} bps (+{(rateRiseBps / 100).toFixed(2)}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="25"
              value={rateRiseBps}
              onChange={(e) => setRateRiseBps(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 bps (Flat)</span>
              <span>+250 bps</span>
              <span>+500 bps (+5.0%)</span>
            </div>
          </div>

          {/* Unemployment Surge Slider */}
          <div className="space-y-2 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Unemployment Surge</span>
              <span className="font-mono font-bold text-indigo-400 text-sm">
                +{unemploymentRise.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={unemploymentRise}
              onChange={(e) => setUnemploymentRise(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Normal)</span>
              <span>+5.0% (Recession)</span>
              <span>+10.0% (Crisis)</span>
            </div>
          </div>
        </div>

        {/* Stress Test Simulation Results */}
        {stressResult && (
          <div className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Baseline Default Rate */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="text-xs text-slate-400 font-medium">Baseline Expected Default</div>
                <div className="text-2xl font-black text-white mt-1">
                  {stressResult.baseline_default_rate.toFixed(2)}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Evaluated across {stressResult.total_loans_evaluated} active loans
                </div>
              </div>

              {/* Stressed Default Rate */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-red-900/50 relative overflow-hidden">
                <div className="text-xs text-red-300 font-medium">Stressed Expected Default</div>
                <div className="text-2xl font-black text-red-400 mt-1">
                  {stressResult.stressed_default_rate.toFixed(2)}%
                </div>
                <div className="text-[11px] text-red-400/80 mt-1 flex items-center gap-1">
                  <span className="font-bold">+{stressResult.default_rate_delta.toFixed(2)}%</span>
                  <span>deterioration in credit risk</span>
                </div>
              </div>

              {/* Loans Degraded */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-amber-900/50">
                <div className="text-xs text-amber-300 font-medium">Risk Migration Delta</div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  +{stressResult.risk_migration.filter(r => ["Fair", "Poor", "Very Poor"].includes(r.tier)).reduce((acc, curr) => acc + Math.max(0, curr.delta), 0)} Loans
                </div>
                <div className="text-[11px] text-amber-400/80 mt-1">
                  Migrated into Subprime / High Risk tiers
                </div>
              </div>
            </div>

            {/* Risk Migration Comparison Bar Chart */}
            <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Risk Tier Migration (Before vs Stressed Scenario)
                </h4>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-3 rounded bg-blue-500" />
                    Baseline
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-3 rounded bg-red-500" />
                    Stressed
                  </span>
                </div>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stressResult.risk_migration}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="tier" tick={{ fill: "#A1A1AA", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#A1A1AA", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#000000",
                        borderColor: "#27272A",
                        borderRadius: "8px",
                        color: "#FFFFFF",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="before_count" name="Baseline Loans" fill="#FFFFFF" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after_count" name="Stressed Loans" fill="#71717A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Systemic Risk Plain-English Narrative */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Systemic Macroeconomic Risk Briefing
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {stressResult.systemic_risk_impact}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
