"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowRight, Shield, Zap, Lock, Globe, Cpu } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-20" />
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl opacity-20" />
          </div>

          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center space-y-8">
              <div className="inline-block">
                <div className="glass rounded-full px-4 py-2 text-sm text-primary font-medium">
                  Powered by Sui Blockchain
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-balance">
                Transfer Files
                <br />
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Securely & Instantly
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                ChainDrop leverages blockchain technology to provide secure, decentralized file transfers with zero
                intermediaries. Your files, your control.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/app"
                  className="glass rounded-lg px-8 py-3 font-semibold text-foreground hover:bg-primary/30 transition-all glow-primary inline-flex items-center justify-center gap-2 group hover-overlay"
                >
                  Start Transferring
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="glass rounded-lg px-8 py-3 font-semibold text-muted-foreground hover:text-foreground transition-colors border border-border/50 hover-overlay">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-32 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose ChainDrop?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience the future of file sharing with blockchain-powered security and instant transfers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: "End-to-End Encrypted",
                  description: "Military-grade encryption ensures your files are protected at every step",
                },
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Instant transfers powered by Sui blockchain technology",
                },
                {
                  icon: Lock,
                  title: "Zero Intermediaries",
                  description: "Decentralized architecture means no central servers storing your data",
                },
                {
                  icon: Globe,
                  title: "Global Access",
                  description: "Transfer files to anyone, anywhere in the world instantly",
                },
                {
                  icon: Cpu,
                  title: "Smart Contracts",
                  description: "Automated verification and secure handoff using blockchain",
                },
                {
                  icon: Lock,
                  title: "Privacy First",
                  description: "Your data never leaves your control until you decide to share",
                },
              ].map((feature, idx) => (
                <div key={idx} className="glass rounded-xl p-6 hover-overlay group">
                  <div className="glow-primary p-3 rounded-lg bg-primary/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-32 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">How It Works</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Upload", description: "Select and upload your files" },
                { step: "2", title: "Encrypt", description: "Files are encrypted on your device" },
                { step: "3", title: "Share", description: "Get a unique transfer link" },
                { step: "4", title: "Receive", description: "Recipient downloads securely" },
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="glass rounded-xl p-6 text-center hover-overlay">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-foreground font-bold text-lg mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 border-t border-border/50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="glass rounded-2xl p-12 space-y-6 hover-overlay">
              <h2 className="text-4xl font-bold">Ready to Transfer Securely?</h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of users who trust ChainDrop for secure file transfers
              </p>
              <Link
                href="/app"
                className="inline-flex items-center gap-2 glass rounded-lg px-8 py-3 font-semibold text-foreground hover:bg-primary/30 transition-all glow-primary group hover-overlay"
              >
                Get Started Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
