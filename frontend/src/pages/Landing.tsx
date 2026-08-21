/**
 * Landing Page - Premium FinanceOS Public Landing
 * Hero section with 3D animations, feature showcase, and CTA buttons
 */

import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Lock, Users, Zap, TrendingUp, PieChart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })

  // 3D mouse tracking for hero background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // 3D perspective effect based on mouse position
  const rotateX = (mousePosition.y - 300) * 0.02
  const rotateY = (mousePosition.x - 400) * 0.02

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' },
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const features = [
    {
      icon: BarChart3,
      title: 'Visual Command Center',
      description: 'Premium dashboard with real-time financial insights and KPIs',
    },
    {
      icon: Lock,
      title: 'Bank-Grade Security',
      description: 'Enterprise-level encryption and authentication for your peace of mind',
    },
    {
      icon: Users,
      title: 'Family Finance',
      description: 'Collaborate with family members and manage shared finances seamlessly',
    },
    {
      icon: Zap,
      title: 'Smart Analytics',
      description: 'AI-powered spending insights and financial patterns',
    },
    {
      icon: TrendingUp,
      title: 'Growth Tracking',
      description: 'Monitor your wealth and financial progress over time',
    },
    {
      icon: PieChart,
      title: 'Category Insights',
      description: 'Intelligent spending breakdown by category with smart categorization',
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-foreground overflow-hidden">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-border backdrop-blur-sm bg-white/80 dark:bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent"
          >
            FinanceOS
          </motion.div>
          <div className="flex gap-4 items-center">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with 3D Background */}
      <section
        ref={containerRef}
        className="relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary gradient glow - follows mouse */}
          <motion.div
            className="absolute w-96 h-96 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"
            animate={{
              x: mousePosition.x - 200,
              y: mousePosition.y - 200,
            }}
            transition={{ type: 'spring', damping: 30, stiffness: 100 }}
          />
          {/* Secondary gradient glow - opposite direction */}
          <motion.div
            className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-purple-600/20 to-blue-600/20 rounded-full blur-3xl"
            animate={{
              x: -mousePosition.x * 0.5,
              y: -mousePosition.y * 0.5,
            }}
            transition={{ type: 'spring', damping: 30, stiffness: 100 }}
          />
        </div>

        {/* Hero Content */}
        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center"
          style={{
            rotateX: `${rotateX}deg`,
            rotateY: `${rotateY}deg`,
            perspective: '1000px',
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 100 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="inline-block mb-6">
              <span className="px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-semibold">
                ✨ Welcome to the Future of Finance
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            <span className="bg-gradient-to-r from-slate-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Your Financial Command Center
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-lg sm:text-xl text-muted-foreground dark:text-slate-400 mb-8 max-w-2xl mx-auto"
          >
            Take control of your finances with a premium, modern financial operating system. Track, analyze, and grow your wealth with confidence.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link to="/register">
              <Button size="lg" className="group">
                Get Started for Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Lock className="w-4 h-4" />
            <span>Bank-grade encryption • No credit card required • 30-day free trial</span>
          </motion.div>
        </motion.div>

        {/* Floating Cards - 3D Effect */}
        <motion.div
          className="absolute top-20 right-10 hidden lg:block"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-4 w-48 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
            <p className="text-2xl font-bold">₹8,42,500</p>
            <p className="text-xs text-green-600 mt-2">↑ 6.4% this month</p>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-32 left-10 hidden lg:block"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-4 w-48 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Monthly Expenses</p>
            <p className="text-2xl font-bold">₹12,450</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Food, Transport, Utilities</p>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-blue-50/50 dark:via-blue-950/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Powerful Features Built for You
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to master your finances in one elegant, intuitive platform
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="group relative p-6 rounded-lg border border-border bg-card/50 hover:bg-card hover:border-primary transition-all duration-300 hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <Icon className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white shadow-2xl"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Take Control?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already managing their finances smarter with FinanceOS
          </p>
          <Link to="/register">
            <Button
              size="lg"
              variant="outline"
              className="bg-white hover:bg-gray-100 text-blue-600 border-0"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2026 FinanceOS. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:foreground transition-colors">
              Terms
            </a>
            <a href="#" className="text-muted-foreground hover:foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
