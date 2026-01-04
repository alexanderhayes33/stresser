import { PublicNavbar } from "@/components/public-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Shield, Clock, Infinity, ArrowRight, Sparkles, TrendingUp, Activity, Users, Target, CheckCircle2 } from "lucide-react"
import { SaturnHubLogo } from "@/components/saturn-hub-logo"
import Link from "next/link"
import HomeStatsClient from "@/components/home-stats-client"
import { HeroTextAnimation, TypewriterText, GradientText } from "@/components/hero-text-animation"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative bg-pattern">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-primary/8 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-primary/6 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
      </div>
      
      {/* Grid overlay */}
      <div className="fixed inset-0 -z-10 bg-grid opacity-20" />

      <PublicNavbar />
      
      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="gradient-hero absolute inset-0 rounded-3xl -z-10" />
          <div className="text-center space-y-8 relative">
            <HeroTextAnimation delay={200} variant="fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 animate-pulse-glow">
              <span className="text-sm font-medium">Professional Stress Testing Platform</span>
            </div>
            </HeroTextAnimation>
            
            <h1 className="text-4xl lg:text-7xl font-bold tracking-tight">
              <HeroTextAnimation delay={400} variant="fade-up">
                <GradientText className="gradient-text-animated">
                  <TypewriterText text="Saturn Hub" speed={80} delay={600} />
                </GradientText>
              </HeroTextAnimation>
              <br />
              <HeroTextAnimation delay={1200} variant="slide-up">
                <span className="text-3xl lg:text-5xl mt-2 block">
                  Power Your Infrastructure Testing
                </span>
              </HeroTextAnimation>
            </h1>
            
            <HeroTextAnimation delay={1600} variant="fade-up">
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Test your infrastructure with powerful{" "}
                <span className="font-semibold text-foreground animate-pulse">Layer 4 & Layer 7</span> attack methods. 
                <br className="hidden sm:block" />
              Enterprise-grade security with real-time monitoring.
            </p>
            </HeroTextAnimation>
            
            <HeroTextAnimation delay={2000} variant="fade-up">
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button size="lg" className="gradient-primary text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" asChild>
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary hover:text-primary transition-all duration-300" asChild>
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
            </HeroTextAnimation>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-12 lg:py-16">
          <HomeStatsClient />
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="gradient-text">Powerful Features</span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for professional stress testing and infrastructure validation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="gradient-feature-icon rounded-xl p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Multiple Attack Methods</CardTitle>
                <CardDescription className="text-base">
                  Support for Layer 4 and Layer 7 attack methods including LDAP, UDP, TCP, and more
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="gradient-feature-icon rounded-xl p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Secure & Reliable</CardTitle>
                <CardDescription className="text-base">
                  Enterprise-grade security with user authentication and role-based access control
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="gradient-feature-icon rounded-xl p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Real-time Monitoring</CardTitle>
                <CardDescription className="text-base">
                  Track your attacks in real-time with detailed statistics and history
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="gradient-feature-icon rounded-xl p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Infinity className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Scalable Plans</CardTitle>
                <CardDescription className="text-base">
                  Choose from multiple pricing plans that fit your testing needs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="gradient-feature-icon rounded-xl p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Concurrent Attacks</CardTitle>
                <CardDescription className="text-base">
                  Launch multiple concurrent attacks to test your infrastructure under heavy load
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="gradient-card hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="gradient-feature-icon rounded-xl p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Admin Dashboard</CardTitle>
                <CardDescription className="text-base">
                  Comprehensive Backoffice for managing users, methods, and plans
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 lg:py-32">
          <Card className="gradient-cta text-primary-foreground border-0 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            <CardHeader className="text-center relative z-10">
              <CardTitle className="text-4xl lg:text-5xl font-bold mb-4">
                Ready to Get Started?
              </CardTitle>
              <CardDescription className="text-primary-foreground/90 text-lg lg:text-xl">
                Join thousands of users testing their infrastructure with Saturn Hub
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center relative z-10">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" asChild>
                  <Link href="/register">
                    Create Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-primary-foreground/50 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/20 hover:border-primary-foreground/70 transition-all duration-300" asChild>
                  <Link href="/pricing">
                    View Pricing
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <SaturnHubLogo size="sm" variant="gradient" />
              <span className="font-bold text-lg">Saturn Hub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Saturn Hub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
