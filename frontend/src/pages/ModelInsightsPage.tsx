import React, { useState, useEffect } from "react"
import {
  Cpu,
  ShieldAlert,
  BarChart2,
  GitCompare,
  TrendingUp,
  Scale,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from "recharts"
import { ModelMetricsResponse, FairnessResponse } from "../lib/types"
import { fetchModelMetrics, fetchFairnessAudit } from "../lib/api"
import { formatPercent } from "../lib/utils"

export const ModelInsightsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null)
  const [fairness, setFairness] = useState<FairnessResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchModelMetrics(), fetchFairnessAudit()])
      .then(([m, f]) => {
        setMetrics(m)
        setFairness(f)
      })
      .catch((err) => console.error("Failed to load model insights:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !metrics || !fairness) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading model governance telemetry...</span>
        </div>
      </div>
    )
  }

  const { model_comparison, top_feature_importance, roc_curve, dataset, how_the_model_works } = metrics

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
            <Cpu className="w-4 h-4" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Model Governance & Fairness Transparency
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Independent algorithmic validation, discriminatory bias audits, ROC characteristics, and empirical confusion matrices.
        </p>
      </div>

      {/* Human Decision Support Banner (Mandatory Regulatory requirement) */}
      <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
          <span className="font-bold">Human-in-the-Loop Decision Support: </span>
          {fairness.human_decision_disclaimer}
        </div>
      </div>

      {/* Model Architecture Explanation Card */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {how_the_model_works.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5">
            {how_the_model_works.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {how_the_model_works.key_pillars.map((pillar, i) => (
            <div key={i} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{pillar.title}</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{pillar.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Model Evaluation & Benchmark Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Trained on {dataset.train_records.toLocaleString()} records, rigorously validated on hold-out {dataset.test_records.toLocaleString()} test records
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Selected: XGBoost (Calibrated)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">Model Candidate</th>
                <th className="py-2.5 px-3">AUC-ROC</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3">F1 Score</th>
                <th className="py-2.5 px-3">Brier Score</th>
                <th className="py-2.5 px-3">Confusion Matrix (TN / FP / FN / TP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {model_comparison.map((m) => {
                const isSelected = m.model_name.includes("XGBoost")
                const cm = m.confusion_matrix
                return (
                  <tr key={m.model_name} className={isSelected ? "bg-blue-50/40 dark:bg-blue-950/20 font-medium" : ""}>
                    <td className="py-3 px-3">
                      <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        {m.model_name}
                        {isSelected && <span className="text-[10px] text-zinc-900 dark:text-white uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">(In Prod)</span>}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{m.strengths}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-zinc-900 dark:text-white">
                      {m.auc_roc.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 font-mono">{m.precision.toFixed(4)}</td>
                    <td className="py-3 px-3 font-mono">{m.recall.toFixed(4)}</td>
                    <td className="py-3 px-3 font-mono">{m.f1_score.toFixed(4)}</td>
                    <td className="py-3 px-3 font-mono text-zinc-900 dark:text-white font-semibold">
                      {m.brier_score.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-500">
                      [{cm[0][0]}, {cm[0][1]} / {cm[1][0]}, {cm[1][1]}]
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row: ROC Curve & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve Chart */}
        <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                Receiver Operating Characteristic (ROC)
              </h4>
              <p className="text-xs text-zinc-500">True Positive Rate vs False Positive Rate</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700">
              AUC = {model_comparison[1]?.auc_roc.toFixed(3) || "0.801"}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roc_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="fpr" tick={{ fontSize: 10 }} label={{ value: "False Positive Rate", position: "insideBottom", offset: -5, fontSize: 10 }} />
                <YAxis dataKey="tpr" tick={{ fontSize: 10 }} label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [val, name]}
                  contentStyle={{
                    backgroundColor: "#000000",
                    borderColor: "#27272A",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "12px"
                  }}
                />
                <Line type="monotone" dataKey="tpr" stroke="#FFFFFF" strokeWidth={2.5} dot={false} name="XGBoost Classifier" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Feature Importance Chart */}
        <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Global Feature Importance (Tree Gain)
            </h4>
            <p className="text-xs text-zinc-500">Predictive variance explained across decision trees</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top_feature_importance.slice(0, 8)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 9 }} width={80} />
                <Tooltip
                  formatter={(val: any) => [val.toFixed(4), "Importance"]}
                  contentStyle={{
                    backgroundColor: "#000000",
                    borderColor: "#27272A",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "12px"
                  }}
                />
                <Bar dataKey="importance" fill="#E4E4E7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fairness & Demographic Disparity Audit */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Responsible AI & Demographic Fairness Audit
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              US Equal Credit Opportunity Act (ECOA) & CFPB 4/5ths Rule Disparate Impact Monitoring across Age Bands
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono self-start sm:self-auto">
            Protected classes excluded: {fairness.protected_attributes_excluded.join(", ")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">Age Bracket</th>
                <th className="py-2.5 px-3">Sample Count</th>
                <th className="py-2.5 px-3">Approval Rate</th>
                <th className="py-2.5 px-3">Disparate Impact Ratio (DIR)</th>
                <th className="py-2.5 px-3">4/5ths Rule Compliance</th>
                <th className="py-2.5 px-3">Fair Lending Finding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {fairness.age_bands.map((band) => {
                return (
                  <tr key={band.age_band}>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {band.age_band} Years
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {band.applicant_count} applicants
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {band.approval_rate_pct}%
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {band.disparity_ratio.toFixed(3)}
                    </td>
                    <td className="py-3 px-3">
                      {band.compliant_four_fifths_rule ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Compliant (&ge; 0.80)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          Audit Review (&lt; 0.80)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 leading-snug max-w-sm">
                      {band.note}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
