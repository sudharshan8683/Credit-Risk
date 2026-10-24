import React, { useState, useEffect } from "react"
import {
  Search,
  Filter,
  ArrowUpDown,
  FileDown,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building
} from "lucide-react"
import { ApplicationSummary, AssessmentResponse } from "../lib/types"
import { fetchApplications, fetchApplicationDetail, getExportPdfUrl } from "../lib/api"
import { formatINR, formatPercent } from "../lib/utils"
import { ApplicationDrawer } from "../components/ApplicationDrawer"

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationSummary[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(12)

  // Filter & Search states
  const [search, setSearch] = useState<string>("")
  const [decisionFilter, setDecisionFilter] = useState<string>("all")
  const [riskBandFilter, setRiskBandFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<string>("desc")

  // Selected for Drawer
  const [selectedApp, setSelectedApp] = useState<AssessmentResponse | null>(null)
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false)

  const loadApplications = async () => {
    try {
      setLoading(true)
      const data = await fetchApplications({
        search: search.trim() || undefined,
        decision: decisionFilter,
        risk_band: riskBandFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize
      })
      setApplications(data.applications)
      setTotal(data.total)
    } catch (err: any) {
      console.error("Failed to load applications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [page, decisionFilter, riskBandFilter, sortBy, sortOrder])

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadApplications()
  }

  // Handle row click to open drawer
  const handleViewDetail = async (id: number) => {
    try {
      setDrawerLoading(true)
      const detail = await fetchApplicationDetail(id)
      setSelectedApp(detail)
    } catch (err: any) {
      alert("Failed to load application details: " + err.message)
    } finally {
      setDrawerLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Applications Ledger
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Historical database of all algorithmic credit evaluations with full audit trail and PDF generation.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
          {total} Total Recorded Assessments
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search applicant name or loan purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Decision Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Decision:</span>
            <select
              value={decisionFilter}
              onChange={(e) => {
                setDecisionFilter(e.target.value)
                setPage(1)
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Decisions</option>
              <option value="Approve">Approve</option>
              <option value="Manual Review">Manual Review</option>
              <option value="Reject">Reject</option>
            </select>
          </div>

          {/* Risk Band Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Risk Band:</span>
            <select
              value={riskBandFilter}
              onChange={(e) => {
                setRiskBandFilter(e.target.value)
                setPage(1)
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Bands</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Very Poor">Very Poor</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">Date Created</option>
              <option value="credit_score">Credit Score</option>
              <option value="monthly_income">Income</option>
              <option value="loan_amount">Loan Amount</option>
              <option value="probability_of_default">Default Risk</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Ref ID</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Monthly Income</th>
                <th className="py-3 px-4">Requested Facility</th>
                <th className="py-3 px-4">Credit Score</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Default Risk</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading ledger records...</span>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching loan applications found.
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const decisionColors = {
                    "Approve": "bg-zinc-900 text-white border-zinc-800 dark:bg-white dark:text-black dark:border-white font-semibold",
                    "Manual Review": "bg-transparent text-zinc-900 border-zinc-400 dark:text-zinc-100 dark:border-zinc-500 font-medium",
                    "Reject": "bg-zinc-100 text-zinc-500 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                  }[app.decision] || "bg-zinc-100 text-zinc-700"

                  const tierColors = {
                    "Excellent": "text-zinc-950 dark:text-white font-bold",
                    "Good": "text-zinc-700 dark:text-zinc-300 font-semibold",
                    "Fair": "text-zinc-500 dark:text-zinc-400",
                    "Poor": "text-zinc-400 dark:text-zinc-500",
                    "Very Poor": "text-zinc-400 dark:text-zinc-600 line-through"
                  }[app.risk_band]

                  return (
                    <tr
                      key={app.id}
                      onClick={() => handleViewDetail(app.id)}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-zinc-400">
                        #{app.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline transition-colors">
                          {app.applicant_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Age {app.age} • {app.created_at.slice(0, 10)}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {formatINR(app.monthly_income)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {formatINR(app.loan_amount)}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {app.loan_purpose.replace("_", " ")}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {app.credit_score}
                        </span>
                        <span className="text-[10px] text-slate-400"> / 850</span>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        <span className={tierColors}>{app.risk_band}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${decisionColors}`}>
                          {app.decision}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {formatPercent(app.probability_of_default * 100)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleViewDetail(app.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
                            title="Inspect Underwriting Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={getExportPdfUrl(app.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                            title="Export PDF Report"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> of{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-out Application Detail Drawer */}
      <ApplicationDrawer
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
      />
    </div>
  )
}
