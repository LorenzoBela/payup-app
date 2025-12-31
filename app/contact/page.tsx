"use client";

import Link from "next/link";
import { useState } from "react";
import { DollarSign, ArrowLeft, Mail, MessageSquare, Clock, Send, CheckCircle, MapPin, HelpCircle, Bug, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "../../components/ui/textarea"; // ui component

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [submitted, setSubmitted] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = [
        { id: "general", icon: MessageSquare, label: "General Inquiry", description: "Questions about PayUp" },
        { id: "support", icon: HelpCircle, label: "Support", description: "Need help with the app" },
        { id: "bug", icon: Bug, label: "Report a Bug", description: "Something not working" },
        { id: "feature", icon: Lightbulb, label: "Feature Request", description: "Suggest an improvement" }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate form submission
        setTimeout(() => {
            setSubmitted(true);
        }, 500);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: "circOut" }}
                className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md"
            >
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="bg-primary p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                            <DollarSign className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">PayUp</span>
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-5xl">
                    {/* Hero */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center justify-center bg-secondary/50 w-16 h-16 rounded-2xl mb-6">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Get in Touch</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Have questions, feedback, or need help? We&apos;d love to hear from you. Choose a category below and send us a message.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-5 gap-12">
                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="lg:col-span-3"
                        >
                            <AnimatePresence mode="wait">
                                {submitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-12 rounded-3xl bg-card border border-white/5 text-center"
                                    >
                                        <div className="inline-flex items-center justify-center bg-green-500/10 w-20 h-20 rounded-full mb-6">
                                            <CheckCircle className="w-10 h-10 text-green-500" />
                                        </div>
                                        <h2 className="text-2xl font-bold mb-3">Message Sent!</h2>
                                        <p className="text-muted-foreground mb-6">
                                            Thank you for reaching out. We&apos;ll get back to you within 24-48 hours.
                                        </p>
                                        <Button
                                            onClick={() => {
                                                setSubmitted(false);
                                                setFormData({ name: "", email: "", subject: "", message: "" });
                                                setSelectedCategory(null);
                                            }}
                                            variant="outline"
                                            className="rounded-full px-6"
                                        >
                                            Send Another Message
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        onSubmit={handleSubmit}
                                        className="p-8 rounded-3xl bg-card border border-white/5"
                                        initial={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {/* Category Selection */}
                                        <div className="mb-8">
                                            <label className="block text-sm font-medium mb-4">What can we help you with?</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {categories.map((category) => (
                                                    <button
                                                        key={category.id}
                                                        type="button"
                                                        onClick={() => setSelectedCategory(category.id)}
                                                        className={`p-4 rounded-xl border text-left transition-all ${selectedCategory === category.id
                                                            ? "border-primary bg-primary/5"
                                                            : "border-white/5 hover:border-white/10 bg-secondary/20"
                                                            }`}
                                                    >
                                                        <category.icon className={`w-5 h-5 mb-2 ${selectedCategory === category.id ? "text-primary" : "text-muted-foreground"}`} />
                                                        <div className="font-medium text-sm">{category.label}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">{category.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="space-y-5">
                                            <div className="grid sm:grid-cols-2 gap-5">
                                                <div>
                                                    <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        placeholder="Your name"
                                                        required
                                                        className="rounded-xl bg-secondary/50 border-white/10 focus:border-primary h-12"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="your@email.com"
                                                        required
                                                        className="rounded-xl bg-secondary/50 border-white/10 focus:border-primary h-12"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
                                                <Input
                                                    id="subject"
                                                    name="subject"
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    placeholder="What's this about?"
                                                    required
                                                    className="rounded-xl bg-secondary/50 border-white/10 focus:border-primary h-12"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                                                <Textarea
                                                    id="message"
                                                    name="message"
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    placeholder="Tell us more..."
                                                    required
                                                    rows={5}
                                                    className="rounded-xl bg-secondary/50 border-white/10 focus:border-primary resize-none"
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                                            >
                                                Send Message <Send className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Contact Info Sidebar */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="lg:col-span-2 space-y-6"
                        >
                            {/* Email Card */}
                            <div className="p-6 rounded-3xl bg-card border border-white/5">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-secondary/50 w-12 h-12 rounded-xl flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Email Us</h3>
                                        <p className="text-sm text-muted-foreground">We reply within 24 hours</p>
                                    </div>
                                </div>
                                <a href="mailto:support@payup.app" className="text-primary hover:underline">
                                    support@payup.app
                                </a>
                            </div>

                            {/* Response Time Card */}
                            <div className="p-6 rounded-3xl bg-card border border-white/5">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-secondary/50 w-12 h-12 rounded-xl flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Response Time</h3>
                                        <p className="text-sm text-muted-foreground">Typical turnaround</p>
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    We aim to respond to all inquiries within <span className="text-foreground font-medium">24-48 hours</span> during business days.
                                </p>
                            </div>

                            {/* Location Card */}
                            <div className="p-6 rounded-3xl bg-card border border-white/5">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-secondary/50 w-12 h-12 rounded-xl flex items-center justify-center">
                                        <MapPin className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Location</h3>
                                        <p className="text-sm text-muted-foreground">Where we&apos;re based</p>
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    Built with ❤️ for students everywhere
                                </p>
                            </div>

                            {/* FAQ Link */}
                            <div className="p-6 rounded-3xl bg-secondary/20 border border-white/5 text-center">
                                <h3 className="font-semibold mb-2">Looking for Answers?</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Check our documentation for common questions and guides.
                                </p>
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:underline"
                                >
                                    View Features <ArrowLeft className="w-4 h-4 rotate-180" />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

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
                            © 2025 PayUp. Built for everyone.
                        </p>
                        <div className="flex gap-8">
                            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Privacy
                            </Link>
                            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Terms
                            </Link>
                            <Link href="/contact" className="text-sm text-foreground font-medium transition-colors">
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
