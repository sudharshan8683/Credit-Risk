import {
  ApplicantInput,
  AssessmentResponse,
  PresetApplicant,
  PortfolioStatsResponse,
  StressTestRequest,
  StressTestResponse,
  ApplicationsListResponse,
  ModelMetricsResponse,
  FairnessResponse,
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  DemoAccount
} from "./types"

const API_BASE = "/api"

const TOKEN_KEY = "creditsense_auth_token"
const USER_KEY = "creditsense_auth_user"

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getCachedUser(): User | null {
  const stored = localStorage.getItem(USER_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  return headers
}

// Authentication API
export async function loginUser(req: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }))
    throw new Error(err.detail || "Invalid username or password")
  }
  const data: AuthResponse = await res.json()
  setAuthSession(data.token, data.user)
  return data
}

export async function registerUser(req: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Registration failed" }))
    throw new Error(err.detail || "Registration failed")
  }
  const data: AuthResponse = await res.json()
  setAuthSession(data.token, data.user)
  return data
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    clearAuthSession()
    throw new Error("Session expired")
  }
  return res.json()
}

export async function fetchDemoAccounts(): Promise<DemoAccount[]> {
  const res = await fetch(`${API_BASE}/auth/demo-accounts`)
  if (!res.ok) throw new Error("Failed to load demo accounts")
  return res.json()
}

// Presets & Scoring
export async function fetchPresets(): Promise<PresetApplicant[]> {
  const res = await fetch(`${API_BASE}/assess/presets`)
  if (!res.ok) throw new Error("Failed to fetch presets")
  return res.json()
}

export async function assessApplicant(data: ApplicantInput, autoSave: boolean = true): Promise<AssessmentResponse> {
  const res = await fetch(`${API_BASE}/assess?auto_save=${autoSave}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Scoring request failed" }))
    throw new Error(err.detail || "Scoring request failed")
  }
  return res.json()
}

export async function fetchPortfolioStats(): Promise<PortfolioStatsResponse> {
  const res = await fetch(`${API_BASE}/portfolio/stats`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error("Failed to fetch portfolio statistics")
  return res.json()
}

export async function runStressTest(req: StressTestRequest): Promise<StressTestResponse> {
  const res = await fetch(`${API_BASE}/portfolio/stress-test`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(req)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Stress test failed" }))
    throw new Error(err.detail || "Stress test failed")
  }
  return res.json()
}

export async function fetchApplications(params: {
  search?: string
  decision?: string
  risk_band?: string
  sort_by?: string
  sort_order?: string
  page?: number
  page_size?: number
}): Promise<ApplicationsListResponse> {
  const url = new URL(`${API_BASE}/applications`, window.location.origin)
  if (params.search) url.searchParams.set("search", params.search)
  if (params.decision && params.decision !== "all") url.searchParams.set("decision", params.decision)
  if (params.risk_band && params.risk_band !== "all") url.searchParams.set("risk_band", params.risk_band)
  if (params.sort_by) url.searchParams.set("sort_by", params.sort_by)
  if (params.sort_order) url.searchParams.set("sort_order", params.sort_order)
  if (params.page) url.searchParams.set("page", params.page.toString())
  if (params.page_size) url.searchParams.set("page_size", params.page_size.toString())

  const res = await fetch(url.toString(), {
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error("Failed to fetch applications")
  return res.json()
}

export async function fetchApplicationDetail(id: number): Promise<AssessmentResponse> {
  const res = await fetch(`${API_BASE}/applications/${id}`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error(`Failed to fetch application ${id}`)
  return res.json()
}

export function getExportPdfUrl(id: number): string {
  return `${API_BASE}/applications/${id}/export-pdf`
}

export async function fetchModelMetrics(): Promise<ModelMetricsResponse> {
  const res = await fetch(`${API_BASE}/model/metrics`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error("Failed to fetch model metrics")
  return res.json()
}

export async function fetchFairnessAudit(): Promise<FairnessResponse> {
  const res = await fetch(`${API_BASE}/model/fairness`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error("Failed to fetch fairness audit")
  return res.json()
}
