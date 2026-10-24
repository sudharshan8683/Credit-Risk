import React from "react"
import { motion } from "framer-motion"
import { RiskBand, Decision } from "../lib/types"

interface ScoreGaugeProps {
  score: number
  riskBand: RiskBand
  decision: Decision
  probabilityOfDefault: number
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  riskBand,
  decision,
  probabilityOfDefault
}) => {
  // Normalize score from 300-850 to 0-1
  const minScore = 300
  const maxScore = 850
  const clamped = Math.min(Math.max(score, minScore), maxScore)
  const ratio = (clamped - minScore) / (maxScore - minScore)
  
  // Angle: -90 deg (left) to +90 deg (right)
  const angle = -90 + ratio * 180

  // Colors based on risk band (Monochrome high contrast)
  const bandConfig: Record<RiskBand, { color: string; bg: string; text: string }> = {
    "Excellent": { color: "#FFFFFF", bg: "bg-zinc-900 text-white dark:bg-white dark:text-black", text: "text-zinc-900 dark:text-white" },
    "Good": { color: "#D4D4D8", bg: "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black", text: "text-zinc-800 dark:text-zinc-200" },
    "Fair": { color: "#A1A1AA", bg: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200", text: "text-zinc-700 dark:text-zinc-300" },
    "Poor": { color: "#71717A", bg: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400", text: "text-zinc-600 dark:text-zinc-400" },
    "Very Poor": { color: "#3F3F46", bg: "bg-zinc-100 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-500", text: "text-zinc-500 dark:text-zinc-500" },
  }

  const decisionConfig: Record<Decision, { label: string; bg: string; text: string; border: string }> = {
    "Approve": {
      label: "APPROVE",
      bg: "bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white",
      text: "text-zinc-900 dark:text-white",
      border: "border-black dark:border-white"
    },
    "Manual Review": {
      label: "MANUAL REVIEW",
      bg: "bg-transparent text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-300",
      text: "text-zinc-900 dark:text-zinc-100",
      border: "border-zinc-500 dark:border-zinc-400"
    },
    "Reject": {
      label: "REJECT",
      bg: "bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-800",
      text: "text-zinc-600 dark:text-zinc-400",
      border: "border-zinc-400 dark:border-zinc-700"
    }
  }

  const activeBand = bandConfig[riskBand] || bandConfig["Good"]
  const activeDecision = decisionConfig[decision] || decisionConfig["Manual Review"]

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
      {/* Semi-circular gauge container */}
      <div className="relative w-64 h-36 flex items-end justify-center">
        <svg viewBox="0 0 200 115" className="w-full h-full overflow-visible">
          {/* Monochrome Gradient Definition */}
          <defs>
            <linearGradient id="scoreGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#27272A" />
              <stop offset="35%" stopColor="#52525B" />
              <stop offset="70%" stopColor="#A1A1AA" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            className="text-zinc-200 dark:text-zinc-800"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Color Gradient Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#scoreGaugeGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset="0"
            opacity="0.9"
          />

          {/* Needle Indicator */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: angle }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            style={{ originX: "100px", originY: "100px" }}
          >
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="28"
              stroke={activeBand.color}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="8" fill={activeBand.color} />
            <circle cx="100" cy="100" r="4" fill="#000000" />
          </motion.g>

          {/* Scale Labels */}
          <text x="18" y="114" className="text-[9px] fill-zinc-400 font-medium">300</text>
          <text x="94" y="20" className="text-[9px] fill-zinc-400 font-medium">580</text>
          <text x="170" y="114" className="text-[9px] fill-zinc-400 font-medium">850</text>
        </svg>
      </div>

      {/* Numerical Score Display */}
      <div className="mt-2 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <motion.span
            key={score}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white"
          >
            {score}
          </motion.span>
          <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">
            / 850
          </span>
        </div>

        {/* Risk Band & Probability Badges */}
        <div className="mt-2.5 flex items-center justify-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-0.75 rounded-full ${activeBand.bg} border border-zinc-200/60 dark:border-zinc-700/60`}>
            {riskBand} Risk
          </span>
          <span className="text-xs font-semibold px-2 py-0.75 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            PD: {(probabilityOfDefault * 100).toFixed(2)}%
          </span>
        </div>

        {/* Prominent Decision Badge */}
        <div className="mt-3.5">
          <span className={`inline-block text-xs font-bold px-4 py-1.5 rounded-md uppercase tracking-wider shadow-xs ${activeDecision.bg}`}>
            {activeDecision.label}
          </span>
        </div>
      </div>
    </div>
  )
}
