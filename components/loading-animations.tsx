"use client"

import { Mail } from "lucide-react"

export function LoadingRAGAnimation() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <p className="text-sm text-muted-foreground">Searching database for relevant docs...</p>
      <div className="w-full max-w-md h-48">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* Query Box */}
          <rect x="20" y="80" width="80" height="80" rx="8" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <text x="60" y="135" textAnchor="middle" className="text-xs" fill="#2c2416">
            Query
          </text>

          {/* Connection Lines */}
          <line
            x1="100"
            y1="120"
            x2="180"
            y2="60"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />
          <line
            x1="100"
            y1="120"
            x2="180"
            y2="120"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />
          <line
            x1="100"
            y1="120"
            x2="180"
            y2="180"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />

          {/* Data Moving Dots */}
          <circle cx="120" cy="100" r="4" fill="#a66d4b" />
          <circle
            cx="140"
            cy="90"
            r="4"
            fill="#a66d4b"
            className="animate-pulse-dot"
            style={{ animationDelay: "0.4s" }}
          />
          <circle
            cx="160"
            cy="80"
            r="4"
            fill="#a66d4b"
            className="animate-pulse-dot"
            style={{ animationDelay: "0.8s" }}
          />

          {/* Database Icons */}
          <g transform="translate(280, 40)">
            <rect x="0" y="0" width="50" height="50" rx="4" fill="none" stroke="#a66d4b" strokeWidth="2" />
            <path d="M10 20 L40 20 M10 30 L40 30" stroke="#a66d4b" strokeWidth="1" />
          </g>

          <g transform="translate(280, 110)">
            <circle cx="25" cy="25" r="20" fill="none" stroke="#a66d4b" strokeWidth="2" />
            <circle cx="25" cy="25" r="12" fill="none" stroke="#a66d4b" strokeWidth="1" />
          </g>

          <g transform="translate(280, 180)">
            <rect x="0" y="0" width="50" height="50" rx="4" fill="none" stroke="#a66d4b" strokeWidth="2" />
            <path d="M15 15 L35 35 M35 15 L15 35" stroke="#a66d4b" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </div>
  )
}

export function LoadingSendingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <p className="text-sm text-muted-foreground">Sending emails to employees...</p>
      <div className="w-full max-w-md h-48">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* Source */}
          <rect x="20" y="100" width="60" height="60" rx="6" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <path d="M35 130 L50 120 L65 130 M35 140 L65 140" stroke="#a66d4b" strokeWidth="2" />
          <text x="50" y="185" textAnchor="middle" className="text-xs" fill="#2c2416">
            Source
          </text>

          {/* Animated Connections */}
          <line
            x1="80"
            y1="120"
            x2="120"
            y2="100"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />
          <line
            x1="80"
            y1="130"
            x2="120"
            y2="130"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />
          <line
            x1="80"
            y1="140"
            x2="120"
            y2="160"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />

          {/* Moving Envelopes */}
          <g transform="translate(100, 95)" style={{ animationDelay: "0s" }}>
            <rect x="0" y="0" width="20" height="12" rx="2" fill="none" stroke="#a66d4b" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="20" y2="12" stroke="#a66d4b" strokeWidth="1" />
          </g>
          <g transform="translate(110, 125)" style={{ animationDelay: "0.4s" }}>
            <rect
              x="0"
              y="0"
              width="20"
              height="12"
              rx="2"
              fill="none"
              stroke="#a66d4b"
              strokeWidth="1.5"
              className="animate-pulse-dot"
            />
            <line x1="0" y1="0" x2="20" y2="12" stroke="#a66d4b" strokeWidth="1" />
          </g>
          <g transform="translate(120, 155)" style={{ animationDelay: "0.8s" }}>
            <rect
              x="0"
              y="0"
              width="20"
              height="12"
              rx="2"
              fill="none"
              stroke="#a66d4b"
              strokeWidth="1.5"
              className="animate-pulse-dot"
            />
            <line x1="0" y1="0" x2="20" y2="12" stroke="#a66d4b" strokeWidth="1" />
          </g>

          {/* Destination Icons */}
          <circle cx="320" cy="100" r="15" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <path d="M318 100 L320 102 L323 99" stroke="#a66d4b" strokeWidth="2" fill="none" />

          <circle cx="320" cy="130" r="15" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <path d="M318 130 L320 132 L323 129" stroke="#a66d4b" strokeWidth="2" fill="none" />

          <circle cx="320" cy="160" r="15" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <path d="M318 160 L320 162 L323 159" stroke="#a66d4b" strokeWidth="2" fill="none" />

          {/* Progress bar */}
          <rect x="40" y="240" width="240" height="8" rx="4" fill="#e8e0d5" />
          <rect x="40" y="240" width="96" height="8" rx="4" fill="#a66d4b" />
          <text x="200" y="268" textAnchor="middle" className="text-xs" fill="#8b7e6f">
            2 / 10
          </text>
        </svg>
      </div>
    </div>
  )
}

export function LoadingGeneratingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <p className="text-sm text-muted-foreground">Generating tailored email</p>
      <div className="space-y-4 w-full">
        <div className="bg-secondary border border-border rounded-lg p-6 space-y-3">
          <div className="flex gap-2 items-center">
            <Mail className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Sponsorship Prize Update</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-foreground">Hi Reno,</p>
            <p className="text-sm text-foreground">We are debat</p>
            <div className="flex gap-1">
              <span className="w-2 h-4 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: "0s" }} />
              <span className="w-2 h-4 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }} />
              <span className="w-2 h-4 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoadingFetchingEmailsAnimation({ progress = 0, total = 0 }: { progress?: number; total?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <p className="text-sm text-muted-foreground">Fetching emails from organization...</p>
      <div className="w-full max-w-md h-48">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* Organization Icon */}
          <rect x="20" y="100" width="80" height="80" rx="8" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <path d="M40 120 L100 120 M40 140 L100 140 M40 160 L100 160" stroke="#a66d4b" strokeWidth="2" />
          <text x="60" y="200" textAnchor="middle" className="text-xs" fill="#2c2416">
            Organization
          </text>

          {/* Connection Lines */}
          <line
            x1="100"
            y1="120"
            x2="180"
            y2="80"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />
          <line
            x1="100"
            y1="140"
            x2="180"
            y2="140"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />
          <line
            x1="100"
            y1="160"
            x2="180"
            y2="200"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />

          {/* Moving Email Icons */}
          <g transform="translate(120, 75)">
            <rect x="0" y="0" width="20" height="12" rx="2" fill="none" stroke="#a66d4b" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="20" y2="12" stroke="#a66d4b" strokeWidth="1" />
          </g>
          <g transform="translate(130, 135)" style={{ animationDelay: "0.4s" }}>
            <rect
              x="0"
              y="0"
              width="20"
              height="12"
              rx="2"
              fill="none"
              stroke="#a66d4b"
              strokeWidth="1.5"
              className="animate-pulse-dot"
            />
            <line x1="0" y1="0" x2="20" y2="12" stroke="#a66d4b" strokeWidth="1" />
          </g>
          <g transform="translate(140, 195)" style={{ animationDelay: "0.8s" }}>
            <rect
              x="0"
              y="0"
              width="20"
              height="12"
              rx="2"
              fill="none"
              stroke="#a66d4b"
              strokeWidth="1.5"
              className="animate-pulse-dot"
            />
            <line x1="0" y1="0" x2="20" y2="12" stroke="#a66d4b" strokeWidth="1" />
          </g>

          {/* Destination - Email List */}
          <rect x="280" y="60" width="100" height="180" rx="4" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <path d="M290 80 L370 80 M290 100 L370 100 M290 120 L370 120" stroke="#a66d4b" strokeWidth="1" />
          <text x="330" y="260" textAnchor="middle" className="text-xs" fill="#2c2416">
            Email List
          </text>

          {/* Progress bar */}
          <rect x="40" y="240" width="240" height="8" rx="4" fill="#e8e0d5" />
          <rect
            x="40"
            y="240"
            width={`${total > 0 ? (progress / total) * 240 : 0}`}
            height="8"
            rx="4"
            fill="#a66d4b"
            className="transition-all duration-300"
          />
          <text x="200" y="268" textAnchor="middle" className="text-xs" fill="#8b7e6f">
            {progress} / {total}
          </text>
        </svg>
      </div>
    </div>
  )
}

export function LoadingPersonalizingEmailsAnimation({
  current = 0,
  total = 0,
}: {
  current?: number
  total?: number
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <p className="text-sm text-muted-foreground">Generating personalized emails for each user...</p>
      <div className="w-full max-w-md h-48">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* User Icons */}
          <circle cx="50" cy="80" r="15" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <path d="M45 90 L55 90 M50 95 L50 100" stroke="#a66d4b" strokeWidth="2" />
          <circle cx="50" cy="140" r="15" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <path d="M45 150 L55 150 M50 155 L50 160" stroke="#a66d4b" strokeWidth="2" />
          <circle cx="50" cy="200" r="15" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <path d="M45 210 L55 210 M50 215 L50 220" stroke="#a66d4b" strokeWidth="2" />

          {/* AI Processing Icon */}
          <g transform="translate(150, 120)">
            <circle cx="0" cy="0" r="25" fill="none" stroke="#a66d4b" strokeWidth="2" />
            <path
              d="M-10 -5 L-5 0 L-10 5 M5 -5 L10 0 L5 5"
              stroke="#a66d4b"
              strokeWidth="2"
              className="animate-pulse-dot"
            />
          </g>

          {/* Connection Lines */}
          <line
            x1="65"
            y1="80"
            x2="125"
            y2="115"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />
          <line
            x1="65"
            y1="140"
            x2="125"
            y2="125"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />
          <line
            x1="65"
            y1="200"
            x2="125"
            y2="135"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />

          {/* Generated Emails */}
          <g transform="translate(280, 70)">
            <rect x="0" y="0" width="80" height="50" rx="4" fill="none" stroke="#a66d4b" strokeWidth="2" />
            <path d="M10 20 L70 20 M10 35 L70 35" stroke="#a66d4b" strokeWidth="1" />
            <text x="40" y="75" textAnchor="middle" className="text-xs" fill="#2c2416">
              Email 1
            </text>
          </g>
          <g transform="translate(280, 130)">
            <rect
              x="0"
              y="0"
              width="80"
              height="50"
              rx="4"
              fill="none"
              stroke="#a66d4b"
              strokeWidth="2"
              className="animate-pulse-dot"
            />
            <path d="M10 20 L70 20 M10 35 L70 35" stroke="#a66d4b" strokeWidth="1" />
            <text x="40" y="75" textAnchor="middle" className="text-xs" fill="#2c2416">
              Email 2
            </text>
          </g>
          <g transform="translate(280, 190)">
            <rect
              x="0"
              y="0"
              width="80"
              height="50"
              rx="4"
              fill="none"
              stroke="#a66d4b"
              strokeWidth="2"
              className="animate-pulse-dot"
              style={{ animationDelay: "0.4s" }}
            />
            <path d="M10 20 L70 20 M10 35 L70 35" stroke="#a66d4b" strokeWidth="1" />
            <text x="40" y="75" textAnchor="middle" className="text-xs" fill="#2c2416">
              Email 3
            </text>
          </g>

          {/* Progress bar */}
          <rect x="40" y="240" width="240" height="8" rx="4" fill="#e8e0d5" />
          <rect
            x="40"
            y="240"
            width={`${total > 0 ? (current / total) * 240 : 0}`}
            height="8"
            rx="4"
            fill="#a66d4b"
            className="transition-all duration-300"
          />
          <text x="200" y="268" textAnchor="middle" className="text-xs" fill="#8b7e6f">
            {current} / {total}
          </text>
        </svg>
      </div>
    </div>
  )
}

export function LoadingResendAnimation({ sent = 0, total = 0 }: { sent?: number; total?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <p className="text-sm text-muted-foreground">Sending emails through Resend API...</p>
      <div className="w-full max-w-md h-48">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* Resend API Icon */}
          <rect x="20" y="100" width="80" height="80" rx="8" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <text x="60" y="135" textAnchor="middle" className="text-xs font-semibold" fill="#2c2416">
            Resend
          </text>
          <text x="60" y="155" textAnchor="middle" className="text-xs" fill="#2c2416">
            API
          </text>

          {/* Animated Connections */}
          <line
            x1="100"
            y1="120"
            x2="150"
            y2="100"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />
          <line
            x1="100"
            y1="140"
            x2="150"
            y2="140"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />
          <line
            x1="100"
            y1="160"
            x2="150"
            y2="180"
            stroke="#a66d4b"
            strokeWidth="2"
            className="animate-flow-line"
            strokeDasharray="1000"
          />

          {/* Moving Envelopes */}
          <g transform="translate(130, 95)">
            <rect x="0" y="0" width="20" height="12" rx="2" fill="none" stroke="#a66d4b" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="20" y2="12" stroke="#a66d4b" strokeWidth="1" />
          </g>
          <g transform="translate(140, 135)" style={{ animationDelay: "0.4s" }}>
            <rect
              x="0"
              y="0"
              width="20"
              height="12"
              rx="2"
              fill="none"
              stroke="#a66d4b"
              strokeWidth="1.5"
              className="animate-pulse-dot"
            />
            <line x1="0" y1="0" x2="20" y2="12" stroke="#a66d4b" strokeWidth="1" />
          </g>
          <g transform="translate(150, 175)" style={{ animationDelay: "0.8s" }}>
            <rect
              x="0"
              y="0"
              width="20"
              height="12"
              rx="2"
              fill="none"
              stroke="#a66d4b"
              strokeWidth="1.5"
              className="animate-pulse-dot"
            />
            <line x1="0" y1="0" x2="20" y2="12" stroke="#a66d4b" strokeWidth="1" />
          </g>

          {/* Destination - Email Servers */}
          <circle cx="320" cy="100" r="20" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <path d="M315 100 L320 105 L325 100" stroke="#a66d4b" strokeWidth="2" fill="none" />
          <text x="320" y="135" textAnchor="middle" className="text-xs" fill="#2c2416">
            Sent
          </text>

          <circle cx="320" cy="160" r="20" fill="none" stroke="#a66d4b" strokeWidth="2" />
          <path d="M315 160 L320 165 L325 160" stroke="#a66d4b" strokeWidth="2" fill="none" />
          <text x="320" y="195" textAnchor="middle" className="text-xs" fill="#2c2416">
            Sent
          </text>

          {/* Progress bar */}
          <rect x="40" y="240" width="240" height="8" rx="4" fill="#e8e0d5" />
          <rect
            x="40"
            y="240"
            width={`${total > 0 ? (sent / total) * 240 : 0}`}
            height="8"
            rx="4"
            fill="#a66d4b"
            className="transition-all duration-300"
          />
          <text x="200" y="268" textAnchor="middle" className="text-xs" fill="#8b7e6f">
            {sent} / {total} sent
          </text>
        </svg>
      </div>
    </div>
  )
}
