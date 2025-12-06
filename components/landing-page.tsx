"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Zap, 
  ArrowRight, 
  Sparkles,
} from "lucide-react"

export function LandingPage({ onGetStarted }: { onGetStarted?: () => void }) {
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({})
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Intersection Observer for scroll animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }))
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" }
    )

    const elements = document.querySelectorAll("[data-animate]")
    elements.forEach((el) => observerRef.current?.observe(el))

    return () => {
      elements.forEach((el) => observerRef.current?.unobserve(el))
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 animate-fade-in-down">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                <Zap className="w-5 h-5 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="text-xl font-bold text-foreground">AgentZero</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onGetStarted}
                className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              >
                Sign In
              </Button>
              <Button
                onClick={onGetStarted}
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div 
            data-animate
            id="hero-badge"
            className={`inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 transition-all duration-1000 ${
              isVisible["hero-badge"] ? "animate-fade-in-up opacity-100" : "opacity-0 translate-y-4"
            }`}
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            AI-Powered Security Training Platform
          </div>
          
          <h1 
            data-animate
            id="hero-title"
            className={`text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight transition-all duration-1000 delay-200 ${
              isVisible["hero-title"] ? "animate-fade-in-up opacity-100" : "opacity-0 translate-y-8"
            }`}
          >
            Protect Your Organization with
            <span className="block text-primary mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-gradient">
              Intelligent Phishing Simulations
            </span>
          </h1>
          
          <p 
            data-animate
            id="hero-description"
            className={`text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-300 ${
              isVisible["hero-description"] ? "animate-fade-in-up opacity-100" : "opacity-0 translate-y-4"
            }`}
          >
            AgentZero helps organizations build stronger security awareness through AI-generated 
            phishing simulation campaigns. Train your team, track engagement, and reduce risk.
          </p>

          <div 
            data-animate
            id="hero-cta"
            className={`flex items-center justify-center pt-4 transition-all duration-1000 delay-500 ${
              isVisible["hero-cta"] ? "animate-fade-in-up opacity-100" : "opacity-0 translate-y-4"
            }`}
          >
            <Button
              onClick={onGetStarted}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 gap-2 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
            >
              Start Campaign
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

