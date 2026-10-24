import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, FileDown, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, Calendar, ArrowRight } from "lucide-react"
import { AssessmentResponse } from "../lib/types"
import { formatINR, formatPercent } from "../lib/utils"
import { getExportPdfUrl } from "../lib/api"
import { ShapFactorsList } from "./ShapFactorsList"

interface ApplicationDrawerProps {
  application: AssessmentResponse | null
  onClose: () => void
}

export const ApplicationDrawer: React.FC<ApplicationDrawerProps> = ({
  application,
  onClose
}) => {
  if (!application) return null

  const {
    id,
    applicant_name,
    credit_score,
    risk_band,
    decision,
    probability_of_default,
    recommended_max_loan_amount,
    suggested_interest_rate_range,
    derived_features,
    top_5_shap_factors,
    what_would_improve_this_score,
    applicant,
    created_at
  } = application

  const decisionBadge = {
    "Approve": { bg: "bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white", text: "" },
    "Manual Review": { bg: "bg-transparent text-zinc-900 dark:text-zinc-100 border border-zinc-500", text: "" },
    "Reject": { bg: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700", text: "" }
  }[decision]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-screen max-w-2xl bg-white dark:bg-zinc-950 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    APP-{id || "N/A"}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${decisionBadge.bg}`}>
                    {decision}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                  {applicant_name}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Assessed on {created_at}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {id && (
                  <a
                    href={getExportPdfUrl(id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs font-semibold border border-black dark:border-white transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Verdict Banner */}
              <div className="grid grid-cols-4 gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-center">
                <div>
                  <div className="text-[11px] text-zinc-400 uppercase font-medium">Credit Score</div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">{credit_score}</div>
                  <div className="text-[10px] text-zinc-400">Scale 300-850</div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400 uppercase font-medium">Risk Band</div>
                  <div className="text-base font-bold text-zinc-800 dark:text-zinc-200 mt-1">{risk_band}</div>
                  <div className="text-[10px] text-zinc-400">Underwriting Tier</div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400 uppercase font-medium">Default Risk</div>
                  <div className="text-base font-bold text-zinc-800 dark:text-zinc-200 mt-1">{(probability_of_default * 100).toFixed(2)}%</div>
                  <div className="text-[10px] text-zinc-400">1-Year Baseline</div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400 uppercase font-medium">Max Loan Cap</div>
                  <div className="text-base font-bold text-zinc-900 dark:text-white mt-1">{formatINR(recommended_max_loan_amount)}</div>
                  <div className="text-[10px] text-zinc-400">{suggested_interest_rate_range}</div>
                </div>
              </div>

              {/* Financial Ratios Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Underwriting & Cash Flow Ratios
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                    <div className="text-[11px] text-slate-400">Total DTI</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatPercent(derived_features.total_dti * 100)}
                    </div>
                    <div className="text-[10px] text-slate-400">Debt + EMI / Income</div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                    <div className="text-[11px] text-slate-400">Loan-to-Income (LTI)</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {derived_features.lti.toFixed(2)}x
                    </div>
                    <div className="text-[10px] text-slate-400">Principal / Annual Inc</div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                    <div className="text-[11px] text-slate-400">Estimated EMI</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatINR(derived_features.estimated_emi)}
                    </div>
                    <div className="text-[10px] text-slate-400">{applicant.loan_term} mo tenure</div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                    <div className="text-[11px] text-slate-400">Card Utilization</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatPercent(applicant.credit_utilization)}
                    </div>
                    <div className="text-[10px] text-slate-400">Revolving credit</div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                    <div className="text-[11px] text-slate-400">Savings Reserve</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatINR(applicant.savings_balance)}
                    </div>
                    <div className="text-[10px] text-slate-400">{formatPercent(derived_features.savings_to_loan * 100)} of loan</div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                    <div className="text-[11px] text-slate-400">Delinquency Flags</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {applicant.past_delinquencies_30d} / {applicant.past_delinquencies_60d} / {applicant.past_delinquencies_90d}
                    </div>
                    <div className="text-[10px] text-slate-400">30d / 60d / 90d</div>
                  </div>
                </div>
              </div>

              {/* SHAP Factors */}
              <div>
                <ShapFactorsList factors={top_5_shap_factors} />
              </div>

              {/* Improvement Suggestions */}
              {what_would_improve_this_score?.length > 0 && (
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-2">
                    Actionable Improvement Plan
                  </h4>
                  <ul className="space-y-2">
                    {what_would_improve_this_score.map((sug, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
              <span>Audited under Fair Lending Guidelines</span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
