"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Receipt, TrendingUp, CheckCircle, Shield, ArrowRight, ChevronRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "circOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <DollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">PayUp</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Sign In
            </Link>
            <Button asChild size="sm" className="rounded-full px-6 font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <motion.div
          style={{ opacity, scale }}
          className="container mx-auto max-w-5xl text-center"
        >
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="space-y-8"
          >
            <motion.div variants={fadeInUp} className="flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-white/10 text-sm font-medium text-secondary-foreground backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Built for Thesis Teams
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
              Split Expenses, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                Stay Connected.
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The minimalist expense tracker designed for students. Track spending, split bills fairly, and settle up without the awkwardness.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="rounded-full px-8 h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
                <Link href="/register">
                  Start for Free <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full px-8 h-12 text-base border-white/10 hover:bg-white/5 transition-all hover:scale-105">
                <Link href="#how-it-works">Learn More</Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[1000px] h-[1000px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-purple-500/30 rounded-full blur-3xl animate-pulse duration-[10s]" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features wrapped in a beautiful, intuitive interface.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 md:py-32 bg-secondary/20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <StepCard key={index} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
              Ready to PayUp?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of students managing their expenses the smart way.
            </p>
            <Button size="lg" asChild className="rounded-full px-10 h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-105">
              <Link href="/register">Get Started Now</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <DollarSign className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">PayUp</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 PayUp. Built for thesis teams.
            </p>
            <div className="flex gap-8">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group p-8 rounded-3xl bg-card border border-white/5 hover:border-primary/20 transition-colors relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="bg-secondary/50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
          <feature.icon className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
        <p className="text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

function StepCard({ step, index }: { step: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      className="text-center relative"
    >
      <div className="w-24 h-24 rounded-full bg-secondary/30 border border-white/10 flex items-center justify-center text-3xl font-bold mx-auto mb-8 relative z-10">
        {index + 1}
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
      </div>
      {index !== 2 && (
        <div className="hidden md:block absolute top-12 left-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-border to-transparent -z-0" />
      )}
      <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
      <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
        {step.description}
      </p>
    </motion.div>
  );
}

const features = [
  {
    icon: Receipt,
    title: "Easy Tracking",
    description: "Log expenses in seconds. Add amounts, descriptions, categories, and even upload receipts."
  },
  {
    icon: Users,
    title: "Fair Auto-Split",
    description: "Expenses are automatically split equally among your thesis group members. No manual math."
  },
  {
    icon: TrendingUp,
    title: "Real-Time Dashboard",
    description: "See who owes what at a glance. Filter by date, member, or category with beautiful charts."
  },
  {
    icon: CheckCircle,
    title: "Settlement Tracking",
    description: "Mark payments as complete and keep a clear history of all settlements within your group."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is protected with enterprise-grade encryption and row-level security."
  },
  {
    icon: DollarSign,
    title: "Decimal Precision",
    description: "Money calculations are handled with precision. No rounding errors or confusing cents."
  }
];

const steps = [
  {
    title: "Sign In",
    description: "Log in securely with your Google account. Only your thesis group members have access."
  },
  {
    title: "Add Expenses",
    description: "Record expenses as they happen. The system automatically calculates who owes what."
  },
  {
    title: "Settle Up",
    description: "When someone pays their share, mark it as complete. Keep track of all balances."
  }
];
