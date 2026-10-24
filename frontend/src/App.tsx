import React, { useState, useEffect } from "react"
import { Sidebar, TabType } from "./components/Sidebar"
import { Header } from "./components/Header"
import { DashboardPage } from "./pages/DashboardPage"
import { NewAssessmentPage } from "./pages/NewAssessmentPage"
import { ApplicationsPage } from "./pages/ApplicationsPage"
import { ModelInsightsPage } from "./pages/ModelInsightsPage"
import { AuthPage } from "./pages/AuthPage"
import { User } from "./lib/types"
import { getCachedUser, clearAuthSession, fetchCurrentUser, getAuthToken } from "./lib/api"

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("creditsense_theme")
    return savedTheme ? savedTheme === "dark" : true
  })
  const [user, setUser] = useState<User | null>(() => getCachedUser())
  const [authChecking, setAuthChecking] = useState<boolean>(true)

  // Initialize theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  // Check and validate active session on mount
  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      fetchCurrentUser()
        .then((currentUser) => {
          setUser(currentUser)
        })
        .catch(() => {
          clearAuthSession()
          setUser(null)
        })
        .finally(() => {
          setAuthChecking(false)
        })
    } else {
      setAuthChecking(false)
    }
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("creditsense_theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("creditsense_theme", "light")
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    setUser(null)
  }

  // If user is not logged in and session check is finished, render AuthPage
  if (!authChecking && !user) {
    return (
      <AuthPage
        onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
    )
  }

  const pageHeaders: Record<TabType, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Portfolio Risk & Macro Stress Testing",
      subtitle: "Capital adequacy, portfolio risk distribution, and downturn scenario simulations"
    },
    new_assessment: {
      title: "Applicant Risk Underwriting",
      subtitle: "Calibrated default probabilities, FICO-scale score, and real-time SHAP factor drivers"
    },
    applications: {
      title: "Institutional Applications Ledger",
      subtitle: "Searchable audit trail, decision drawer, and institutional PDF report export"
    },
    model_insights: {
      title: "Model Governance & Fairness Transparency",
      subtitle: "Model comparison, ROC curve, Gini tree importance, and ECOA age disparity audit"
    }
  }

  const currentHeader = pageHeaders[activeTab]

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-black font-sans transition-colors duration-200">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={currentHeader.title}
          subtitle={currentHeader.subtitle}
          user={user}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === "dashboard" && <DashboardPage />}
          {activeTab === "new_assessment" && <NewAssessmentPage />}
          {activeTab === "applications" && <ApplicationsPage />}
          {activeTab === "model_insights" && <ModelInsightsPage />}
        </main>
      </div>
    </div>
  )
}

export default App
