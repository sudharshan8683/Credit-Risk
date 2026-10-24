import React, { useState, useEffect } from "react"
import {
  User,
  DollarSign,
  CreditCard,
  Briefcase,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileDown,
  CheckCircle2,
  RefreshCw,
  Info,
  Building,
  ShieldCheck,
  TrendingUp,
  RotateCcw
} from "lucide-react"
import {
  ApplicantInput,
  AssessmentResponse,
  PresetApplicant,
  EmploymentStatus,
  LoanPurpose
} from "../lib/types"
import { fetchPresets, assessApplicant, getExportPdfUrl } from "../lib/api"
import { formatINR, formatPercent } from "../lib/utils"
import { ScoreGauge } from "../components/ScoreGauge"
import { ShapFactorsList } from "../components/ShapFactorsList"

const INITIAL_FORM: ApplicantInput = {
  applicant_name: "Rahul Mehra",
  age: 35,
  employment_status: "Employed",
  employment_length: 6.0,
  num_dependents: 1,
  monthly_income: 85000,
  monthly_expenses: 38000,
  existing_debt_payments: 15000,
  savings_balance: 320000,
  credit_history_length: 7.5,
  num_open_credit_lines: 6,
  past_delinquencies_30d: 0,
  past_delinquencies_60d: 0,
  past_delinquencies_90d: 0,
  credit_utilization: 24.0,
  loan_amount: 450000,
  loan_term: 36,
  loan_purpose: "home_improvement"
}

export const NewAssessmentPage: React.FC = () => {
  const [formData, setFormData] = useState<ApplicantInput>(INITIAL_FORM)
  const [presets, setPresets] = useState<PresetApplicant[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResponse | null>(null)
  const [autoEvaluate, setAutoEvaluate] = useState<boolean>(true)

  // Load Presets
  useEffect(() => {
    fetchPresets()
      .then((data) => setPresets(data))
      .catch((err) => console.error("Failed to load presets:", err))
  }, [])

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)

  // Scoring function
  const runAssessment = async (dataToAssess: ApplicantInput = formData, autoSave: boolean = true) => {
    try {
      setLoading(true)
      const res = await assessApplicant(dataToAssess, autoSave)
      setAssessmentResult(res)
      if (autoSave && res.id) {
        setSaveSuccessMessage(`Assessment Record #${res.id} saved to Applications Ledger!`)
        setTimeout(() => setSaveSuccessMessage(null), 4000)
      }
    } catch (err: any) {
      console.error("Assessment failed:", err)
    } finally {
      setLoading(false)
    }
  }

  // Initial assessment on load
  useEffect(() => {
    runAssessment(formData, false)
  }, [])

  // Handle Preset Select
  const handleSelectPreset = (preset: PresetApplicant) => {
    setSelectedPreset(preset.id)
    setFormData(preset.data)
    runAssessment(preset.data, true)
  }

  const handleInputChange = (field: keyof ApplicantInput, value: any) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    setSelectedPreset(null)
    if (autoEvaluate) {
      runAssessment(updated, false)
    }
  }

  const steps = [
    { num: 1, label: "Personal", icon: User },
    { num: 2, label: "Financial", icon: DollarSign },
    { num: 3, label: "Credit Bureau", icon: CreditCard },
    { num: 4, label: "Loan Request", icon: Briefcase },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner & Preset Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Loan Underwriting & Risk Assessment
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time credit score, calibrated probability of default, decision boundaries, and SHAP factor attribution.
          </p>
        </div>

        {/* Load Preset Applicant Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Load Presets:
          </span>
          {presets.map((preset) => {
            const isSelected = selectedPreset === preset.id
            const badgeColor =
              preset.id === "safe"
                ? "border-zinc-300 text-zinc-900 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                : preset.id === "borderline"
                ? "border-zinc-400 text-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 dark:text-zinc-200 dark:border-zinc-700"
                : "border-zinc-300 text-zinc-600 bg-white dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"

            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${badgeColor} ${
                  isSelected ? "ring-2 ring-black dark:ring-white shadow-xs font-bold" : "hover:opacity-80"
                }`}
              >
                {preset.name.split(" ")[0]} ({preset.id.toUpperCase()})
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Grid: Form Left, Real-time Result Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Multi-step Underwriting Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Step Progress Header */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800">
            <div className="grid grid-cols-4 gap-2">
              {steps.map((s) => {
                const Icon = s.icon
                const isActive = currentStep === s.num
                const isCompleted = currentStep > s.num
                return (
                  <button
                    key={s.num}
                    onClick={() => setCurrentStep(s.num)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-black dark:bg-white text-white dark:text-black shadow-xs border border-black dark:border-white"
                        : isCompleted
                        ? "text-zinc-900 dark:text-zinc-100 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form Content Steps */}
          <div className="p-6">
            {/* Step 1: Personal */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
                  Applicant Profile & Demographics
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Applicant Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.applicant_name}
                      onChange={(e) => handleInputChange("applicant_name", e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min={18}
                      max={95}
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", parseInt(e.target.value) || 18)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Employment Status
                    </label>
                    <select
                      value={formData.employment_status}
                      onChange={(e) => handleInputChange("employment_status", e.target.value as EmploymentStatus)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Employed">Employed (Salaried)</option>
                      <option value="Self-Employed">Self-Employed / Business</option>
                      <option value="Retired">Retired</option>
                      <option value="Unemployed">Unemployed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Employment Length (Years)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={45}
                      value={formData.employment_length}
                      onChange={(e) => handleInputChange("employment_length", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Number of Dependents
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={8}
                      value={formData.num_dependents}
                      onChange={(e) => handleInputChange("num_dependents", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Financial */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
                  Financial Capacity & Recurring Cash Flows (INR ₹)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Gross Monthly Income (₹)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min={10000}
                      value={formData.monthly_income}
                      onChange={(e) => handleInputChange("monthly_income", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {formatINR(formData.monthly_income)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Monthly Living Expenses (₹)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min={0}
                      value={formData.monthly_expenses}
                      onChange={(e) => handleInputChange("monthly_expenses", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {formatINR(formData.monthly_expenses)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Existing Monthly Debt / EMI Payments (₹)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min={0}
                      value={formData.existing_debt_payments}
                      onChange={(e) => handleInputChange("existing_debt_payments", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Current DTI: {formatPercent((formData.existing_debt_payments / (formData.monthly_income || 1)) * 100)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Liquid Savings / Deposit Reserves (₹)
                    </label>
                    <input
                      type="number"
                      step="5000"
                      min={0}
                      value={formData.savings_balance}
                      onChange={(e) => handleInputChange("savings_balance", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {formatINR(formData.savings_balance)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Credit Bureau */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
                  Credit Bureau History & Delinquency Flags
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Credit History Length (Years)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={0.5}
                      max={40}
                      value={formData.credit_history_length}
                      onChange={(e) => handleInputChange("credit_history_length", parseFloat(e.target.value) || 0.5)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Number of Open Credit Accounts
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={formData.num_open_credit_lines}
                      onChange={(e) => handleInputChange("num_open_credit_lines", parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Credit Card Utilization (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.credit_utilization}
                        onChange={(e) => handleInputChange("credit_utilization", parseFloat(e.target.value) || 0)}
                        className="w-full accent-blue-600"
                      />
                      <span className="text-sm font-bold w-12 text-right text-slate-700 dark:text-slate-300">
                        {formData.credit_utilization.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Past Delinquencies (30-59 Days)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={formData.past_delinquencies_30d}
                      onChange={(e) => handleInputChange("past_delinquencies_30d", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Past Delinquencies (60-89 Days)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={formData.past_delinquencies_60d}
                      onChange={(e) => handleInputChange("past_delinquencies_60d", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Past Delinquencies (90+ Days)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={formData.past_delinquencies_90d}
                      onChange={(e) => handleInputChange("past_delinquencies_90d", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Loan Details */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
                  Loan Facility Specifications
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Requested Loan Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="10000"
                      min={25000}
                      value={formData.loan_amount}
                      onChange={(e) => handleInputChange("loan_amount", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {formatINR(formData.loan_amount)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tenure (Months)
                    </label>
                    <select
                      value={formData.loan_term}
                      onChange={(e) => handleInputChange("loan_term", parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={12}>12 Months (1 Year)</option>
                      <option value={24}>24 Months (2 Years)</option>
                      <option value={36}>36 Months (3 Years)</option>
                      <option value={48}>48 Months (4 Years)</option>
                      <option value={60}>60 Months (5 Years)</option>
                      <option value={72}>72 Months (6 Years)</option>
                      <option value={84}>84 Months (7 Years)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Loan Purpose
                    </label>
                    <select
                      value={formData.loan_purpose}
                      onChange={(e) => handleInputChange("loan_purpose", e.target.value as LoanPurpose)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="debt_consolidation">Debt Consolidation</option>
                      <option value="home_improvement">Home Renovation / Improvement</option>
                      <option value="business">Small Business Working Capital</option>
                      <option value="auto">Automobile Purchase</option>
                      <option value="education">Higher Education</option>
                      <option value="personal">Personal / Medical</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Step
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => runAssessment(formData, true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold transition-all shadow-md"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Save Assessment Record</span>
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 transition-colors"
                  >
                    Next Step
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Instant Underwriting Verdict & SHAP Results (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {assessmentResult ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Semi-circular Score Gauge */}
              <ScoreGauge
                score={assessmentResult.credit_score}
                riskBand={assessmentResult.risk_band}
                decision={assessmentResult.decision}
                probabilityOfDefault={assessmentResult.probability_of_default}
              />

              {/* Loan Limits & Pricing Card */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recommended Underwriting Terms
                </h4>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400">Max Loan Capacity</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatINR(assessmentResult.recommended_max_loan_amount)}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400">Suggested Interest</span>
                    <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      {assessmentResult.suggested_interest_rate_range}
                    </div>
                  </div>
                </div>

                {/* Derived Metrics Bar */}
                <div className="pt-2 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Total Debt-to-Income (DTI):</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {formatPercent(assessmentResult.derived_features.total_dti * 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Monthly EMI:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {formatINR(assessmentResult.derived_features.estimated_emi)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Savings-to-Loan Ratio:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {formatPercent(assessmentResult.derived_features.savings_to_loan * 100)}
                    </span>
                  </div>
                </div>

                {/* PDF Export Button */}
                {assessmentResult.id && (
                  <div className="pt-2">
                    <a
                      href={getExportPdfUrl(assessmentResult.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Download Credit Report (PDF)</span>
                    </a>
                  </div>
                )}
              </div>

              {/* SHAP Factors */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <ShapFactorsList factors={assessmentResult.top_5_shap_factors} />
              </div>

              {/* Prescriptive Improvement Suggestions */}
              {assessmentResult.what_would_improve_this_score?.length > 0 && (
                <div className="p-5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    <TrendingUp className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                    <span>How To Improve This Score</span>
                  </div>

                  <ul className="space-y-2">
                    {assessmentResult.what_would_improve_this_score.map((sug, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0 mt-0.5" />
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span>Evaluating inputs...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
