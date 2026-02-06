import { Button, Card, CardHeader, CardTitle, CardContent } from "@apex/ui-kit";
import { Rocket, Shield, Zap, ShoppingCart, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold tracking-tight">APEX v2</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Products</a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">Log in</Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32 bg-slate-50 dark:bg-slate-900/50">
          <div className="container relative z-10 px-4 mx-auto">
            <div className="max-w-[800px] space-y-8">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mb-4">
                Phase 4: Visual Engineering Live
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Modular Commerce <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                  Engineering at Scale
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-[600px] leading-relaxed">
                Experience the next generation of modular commerce. Built with atomic design, strict security guards, and sovereign cloud-native architecture.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="gap-2">
                  Explore Storefront <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  View Components
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
        </section>

        {/* Features Section */}
        <section className="py-24 container px-4 mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Sovereign Architecture</h2>
            <p className="text-muted-foreground max-w-[600px] mx-auto">
              Every component is strictly typed and governed by our Constitutional AI system.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary/10">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Hyper Speed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Powered by Bun and Next.js 14 for sub-millisecond interaction times and instant hydration.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary/10">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>S1-S8 Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Strict tenant isolation and RBAC guards built into the core framework at every layer.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary/10">
              <CardHeader>
                <Rocket className="h-10 w-10 text-primary mb-2" />
                <CardTitle>LEGO Modular</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Build features with atomic primitives. Scalable, maintainable, and 100% compliant.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-slate-50 dark:bg-slate-900/50">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-8 px-4 mx-auto">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-bold">APEX v2 PLATFORM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Sovereign Systems. Licensed under the Apex Constitution.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Docs</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
