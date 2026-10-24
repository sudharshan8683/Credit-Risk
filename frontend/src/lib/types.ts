export type EmploymentStatus = "Employed" | "Self-Employed" | "Retired" | "Unemployed"

export type LoanPurpose = 
  | "debt_consolidation" 
  | "home_improvement" 
  | "business" 
  | "auto" 
  | "education" 
  | "personal"

export type RiskBand = "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor"
export type Decision = "Approve" | "Manual Review" | "Reject"

export interface ApplicantInput {
  applicant_name: string
  age: number
  employment_status: EmploymentStatus
  employment_length: number
  num_dependents: number
  monthly_income: number
  monthly_expenses: number
  existing_debt_payments: number
  savings_balance: number
  credit_history_length: number
  num_open_credit_lines: number
  past_delinquencies_30d: number
  past_delinquencies_60d: number
  past_delinquencies_90d: number
  credit_utilization: number
  loan_amount: number
  loan_term: number
  loan_purpose: LoanPurpose
}

export interface DerivedFeatures {
  estimated_emi: number
  dti: number
  emi_to_income: number
  total_dti: number
  lti: number
  savings_to_loan: number
  disposable_income: number
}

export interface ShapFactor {
  feature: string
  name: string
  value: any
  direction: "raises_risk" | "lowers_risk"
  magnitude: number
  impact_score: number
  sentence: string
}

export interface AssessmentResponse {
  id?: number
  applicant_name: string
  probability_of_default: number
  credit_score: number
  risk_band: RiskBand
  decision: Decision
  recommended_max_loan_amount: number
  suggested_interest_rate_range: string
  derived_features: DerivedFeatures
  top_5_shap_factors: ShapFactor[]
  what_would_improve_this_score: string[]
  applicant: ApplicantInput
  created_at: string
}

export interface PresetApplicant {
  id: string
  name: string
  tagline: string
  data: ApplicantInput
}

export interface PortfolioKpis {
  total_applications: number
  approval_rate: number
  average_credit_score: number
  expected_default_rate: number
}

export interface RiskBandDistribution {
  name: string
  count: number
  percentage: number
  color: string
}

export interface ScoreBucket {
  range: string
  min: number
  max: number
  count: number
}

export interface TimelinePoint {
  period: string
  approved: number
  rejected: number
  manual_review: number
  total: number
  approval_rate: number
}

export interface PortfolioStatsResponse {
  kpis: PortfolioKpis
  risk_band_distribution: RiskBandDistribution[]
  score_distribution: ScoreBucket[]
  timeline: TimelinePoint[]
}

export interface StressTestRequest {
  income_shock_pct: number
  interest_rate_rise_bps: number
  unemployment_rise_pct: number
}

export interface RiskMigrationTier {
  tier: string
  before_count: number
  after_count: number
  delta: number
}

export interface StressTestResponse {
  baseline_default_rate: number
  stressed_default_rate: number
  default_rate_delta: number
  total_loans_evaluated: number
  risk_migration: RiskMigrationTier[]
  systemic_risk_impact: string
}

export interface ApplicationSummary {
  id: number
  applicant_name: string
  age: number
  monthly_income: number
  loan_amount: number
  loan_purpose: string
  credit_score: number
  risk_band: string
  decision: string
  probability_of_default: number
  dti: number
  created_at: string
}

export interface ApplicationsListResponse {
  total: number
  page: number
  page_size: number
  applications: ApplicationSummary[]
}

export interface ModelComparison {
  model_name: string
  auc_roc: number
  precision: number
  recall: number
  f1_score: number
  brier_score: number
  confusion_matrix: number[][]
  strengths: string
  limitations: string
}

export interface FeatureImportance {
  feature: string
  importance: number
}

export interface RocPoint {
  threshold: number
  fpr: number
  tpr: number
}

export interface ModelMetricsResponse {
  dataset: {
    total_records: number
    train_records: number
    test_records: number
    features_count: number
    overall_default_rate: number
  }
  model_comparison: ModelComparison[]
  top_feature_importance: FeatureImportance[]
  roc_curve: RocPoint[]
  selected_model: string
  how_the_model_works: {
    title: string
    description: string
    key_pillars: { title: string; detail: string }[]
  }
}

export interface FairnessAgeBand {
  age_band: string
  applicant_count: number
  approval_rate: number
  approval_rate_pct: number
  disparity_ratio: number
  compliant_four_fifths_rule: boolean
  note: string
}

export interface FairnessResponse {
  demographic_attribute: string
  regulatory_standard: string
  human_decision_disclaimer: string
  protected_attributes_excluded: string[]
  age_bands: FairnessAgeBand[]
}

// User Authentication
export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string
  created_at?: string
}

export interface AuthResponse {
  token: string
  user: User
  message: string
}

export interface LoginRequest {
  username_or_email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  full_name: string
  role: string
}

export interface DemoAccount {
  username: string
  email: string
  full_name: string
  role: string
  password: string
}

