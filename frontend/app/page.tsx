/* eslint-disable max-len */
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  IconVideo,
  IconDeviceGamepad2,
  IconBrandInstagram,
  IconMicrophone,
  IconPalette,
  IconTrendingUp,
  IconDashboard,
  IconTrendingUp2,
  IconChartLine,
  IconBulb,
  IconShield,
  IconKey,
  IconDatabase,
  IconEye,
  IconShieldCheck,
  IconTarget,
  IconEyeCheck,
  IconChartBar,
  IconUsers,
  IconFileText,
} from "@tabler/icons-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 min-h-screen bg-gradient-to-b from-[#a8d96a] via-white via-30% to-[#f7f7f7]">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            {/* <Badge
              variant="secondary"
              className="mb-6 bg-white/20 text-black border-black/30"
            >
              <span className="text-yellow-300">★</span> 4.9/5 from 2,000+
              creators
            </Badge> */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-black">
              Introducing Networthy
            </h1>
            <p className="text-lg md:text-xl text-black mb-6 max-w-2xl mx-auto">
              All your revenue. One place. Across all platforms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-[#71bf49] text-white hover:bg-[#71bf49]/90 duration-300 h-[50px] transition-transform transform hover:scale-110"
                asChild
              >
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 bg-white border-white text-black cursor-pointer duration-300 h-[50px] transition-transform transform hover:scale-110"
              >
                Watch Demo
              </Button>
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-6xl aspect-video bg-gray-200 rounded-xl flex items-center justify-center border border-black/20">
                <span className="text-gray-500 text-lg">
                  Demo Video Coming Soon
                </span>
              </div>
            </div>
            <p className="text-sm text-black">
              Currently in beta — join our first 500 creators!
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 md:py-24 relative"
        style={{ backgroundColor: "#f7f7f7" }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Everything you need to <span className="text-primary">grow</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Replace multiple broken tools with Networthy, the only platform
              designed to make your creator business faster—and more profitable.
            </p>
          </div>

          {/* Unique Timeline/Flow Layout */}
          <div className="max-w-7xl mx-auto">
            {/* Feature 1 - Full Width with Side Content */}
            <div className="mb-24">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="lg:w-1/2">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="text-8xl font-black text-primary/20">
                      01
                    </div>
                    <div className="h-1 w-20 bg-primary rounded-full"></div>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Revenue Tracking
                  </h3>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                    Monitor your earnings across YouTube, Twitch, TikTok, and
                    more in one unified dashboard. Track every dollar you earn
                    from every platform.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
                      <IconChartBar className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-sm font-medium text-primary">
                      Real-time revenue monitoring
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <div className="h-80 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-primary/20">
                    <div className="text-center">
                      <IconChartBar className="h-20 w-20 text-primary/40 mx-auto mb-4" />
                      <p className="text-primary/60 font-medium">
                        Revenue Dashboard
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 - Reversed Layout */}
            <div className="mb-24">
              <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                <div className="lg:w-1/2">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="text-8xl font-black text-primary/20">
                      02
                    </div>
                    <div className="h-1 w-20 bg-primary rounded-full"></div>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Growth Analytics
                  </h3>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                    Track your follower growth, engagement rates, and
                    performance trends over time. Understand what drives your
                    success.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
                      <IconTrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-sm font-medium text-primary">
                      Comprehensive growth metrics
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <div className="h-80 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-primary/20">
                    <div className="text-center">
                      <IconTrendingUp className="h-20 w-20 text-primary/40 mx-auto mb-4" />
                      <p className="text-primary/60 font-medium">
                        Growth Charts
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 - Full Width with Side Content */}
            <div className="mb-24">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="lg:w-1/2">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="text-8xl font-black text-primary/20">
                      03
                    </div>
                    <div className="h-1 w-20 bg-primary rounded-full"></div>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Audience Insights
                  </h3>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                    Understand your audience across platforms with detailed
                    analytics. Know who your fans are and what they love.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
                      <IconUsers className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-sm font-medium text-primary">
                      Deep audience understanding
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <div className="h-80 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-primary/20">
                    <div className="text-center">
                      <IconUsers className="h-20 w-20 text-primary/40 mx-auto mb-4" />
                      <p className="text-primary/60 font-medium">
                        Audience Analytics
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4 - Reversed Layout */}
            <div>
              <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                <div className="lg:w-1/2">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="text-8xl font-black text-primary/20">
                      04
                    </div>
                    <div className="h-1 w-20 bg-primary rounded-full"></div>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Performance Reports
                  </h3>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                    Generate comprehensive reports to optimize your content
                    strategy and maximize earnings. Make data-driven decisions.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
                      <IconFileText className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-sm font-medium text-primary">
                      Detailed performance insights
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <div className="h-80 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-primary/20">
                    <div className="text-center">
                      <IconFileText className="h-20 w-20 text-primary/40 mx-auto mb-4" />
                      <p className="text-primary/60 font-medium">
                        Performance Reports
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Horizontal Timeline */}
      <section id="how-it-works" className="py-20 md:py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              How <span className="text-primary">Networthy</span> Works
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          {/* Horizontal Timeline Container */}
          <div className="max-w-6xl mx-auto">
            {/* Timeline Items */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                {/* Content */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center h-full flex flex-col">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">1</span>
                    </div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">
                    Connect Your Platforms
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6 flex-grow">
                    Link your YouTube, Twitch, TikTok, and other creator
                    accounts to start tracking. One-click integration with all
                    major platforms.
                  </p>
                  <div className="flex items-center justify-center gap-3 text-sm font-medium text-primary">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Secure OAuth integration</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                {/* Content */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center h-full flex flex-col">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">2</span>
                    </div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">
                    Automatic Data Sync
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6 flex-grow">
                    Networthy automatically syncs your revenue, followers,
                    views, and engagement data. Real-time updates keep you
                    informed.
                  </p>
                  <div className="flex items-center justify-center gap-3 text-sm font-medium text-primary">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Real-time data synchronization</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                {/* Content */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center h-full flex flex-col">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">3</span>
                    </div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">
                    Get Insights & Grow
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6 flex-grow">
                    Use our analytics to understand trends, optimize content,
                    and increase your earnings. Make data-driven decisions.
                  </p>
                  <div className="flex items-center justify-center gap-3 text-sm font-medium text-primary">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>AI-powered insights</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Networthy Section - Hub & Spoke Design */}
      <section
        className="py-20 md:py-24 relative overflow-hidden"
        style={{ backgroundColor: "#f7f7f7" }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Why Choose <span className="text-primary">Networthy?</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Four powerful ways we save your time and help you earn more money.
            </p>
          </div>

          {/* Hub & Spoke Layout */}
          <div className="max-w-6xl mx-auto relative">
            {/* Feature Cards in Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="group">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full flex flex-col text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconDashboard className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">Unified Dashboard</h4>
                  <p className="text-muted-foreground mb-6 flex-grow">
                    View all your platforms in one place with real-time updates.
                    No more switching between apps.
                  </p>
                  <div className="text-sm font-medium text-primary">
                    Real-time sync across all platforms
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full flex flex-col text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconTrendingUp2 className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">
                    Revenue Optimization
                  </h4>
                  <p className="text-muted-foreground mb-6 flex-grow">
                    Identify your highest-earning content and platforms. Make
                    data-driven decisions to maximize income.
                  </p>
                  <div className="text-sm font-medium text-primary">
                    AI-powered revenue insights
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full flex flex-col text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconChartLine className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">Growth Tracking</h4>
                  <p className="text-muted-foreground mb-6 flex-grow">
                    Monitor your progress with detailed growth analytics. Track
                    trends and patterns to accelerate success.
                  </p>
                  <div className="text-sm font-medium text-primary">
                    Comprehensive growth metrics
                  </div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="group">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full flex flex-col text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconBulb className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">Smart Insights</h4>
                  <p className="text-muted-foreground mb-6 flex-grow">
                    Get AI-powered recommendations to boost your earnings. Let
                    smart algorithms guide your strategy.
                  </p>
                  <div className="text-sm font-medium text-primary">
                    Intelligent recommendations
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-16">
              <div className="inline-flex items-center gap-4 bg-white rounded-full px-8 py-4 shadow-lg border border-gray-100">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-medium">
                  Join creators already growing with Networthy
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect For Section */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Who We Serve
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              From solo creators to growing businesses, we power your success
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {[
              { name: "Content Creators", icon: IconVideo },
              { name: "Streamers & Gamers", icon: IconDeviceGamepad2 },
              { name: "Social Media Influencers", icon: IconBrandInstagram },
              { name: "Podcasters", icon: IconMicrophone },
              { name: "Digital Artists", icon: IconPalette },
              { name: "Creator Business", icon: IconTrendingUp },
            ].map((item, index) => (
              <Card
                key={index}
                className="text-center h-full flex flex-col justify-center min-h-[120px] 
                  hover:shadow-md transition-shadow duration-200"
              >
                <CardContent
                  className="py-4 flex flex-col items-center justify-center 
                  h-full gap-2"
                >
                  <item.icon className="h-6 w-6 text-primary" />
                  <p className="font-semibold text-sm md:text-base leading-tight">
                    {item.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Track Your Success?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of creators who use Networthy to optimize their
            content strategy and maximize their earnings.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6"
            asChild
          >
            <Link href="/register">Access Your Dashboard</Link>
          </Button>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section
        className="py-16 md:py-20"
        style={{ backgroundColor: "#f7f7f7" }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Privacy & Security
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We take your data protection seriously. Your privacy is our
              priority.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <IconShield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Data Encryption</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All your data is encrypted in transit and at rest using
                  industry-standard AES-256 encryption. Your sensitive
                  information is never stored in plain text.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <IconKey className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We use OAuth 2.0 for secure platform connections. Your
                  credentials are never stored on our servers - we only access
                  data through secure API tokens.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <IconDatabase className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Data Control</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  You have complete control over your data. Delete your account
                  anytime and we'll permanently remove all your information from
                  our systems.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <IconEye className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We're transparent about what data we collect and how we use
                  it. Our privacy policy is clear, simple, and easy to
                  understand.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <IconShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>No Data Selling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We never sell, rent, or share your personal data with third
                  parties. Your information is used solely to provide you with
                  our analytics services.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <IconEyeCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>GDPR Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We're fully compliant with GDPR and other privacy regulations.
                  You have the right to access, modify, or delete your data at
                  any time.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-12">
            <p className="text-lg font-medium">
              Your data is protected by enterprise-grade security
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">About Us</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Networthy was born from the recognition that content creators need
              better tools to understand and grow their businesses. We believe
              that every creator deserves access to professional-grade analytics
              and insights that were previously only available to large media
              companies. Our founders, Imran Quazi and Sagar Bhola have built
              Networthy to be the best solution for creators to track their
              success and grow their businesses.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <IconTarget className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    To democratize creator analytics and provide every content
                    creator with the tools they need to build sustainable,
                    profitable businesses from their passion.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <IconEyeCheck className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    A world where creators have complete visibility into their
                    performance, enabling them to make data-driven decisions
                    that maximize their success and impact.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
