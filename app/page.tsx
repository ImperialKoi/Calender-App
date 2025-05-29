import Link from "next/link"
import Image from "next/image"
import { Calendar, Sparkles, Clock, Users, ArrowRight, CheckCircle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900">
      {/* Navigation */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-8 w-8 text-blue-500" />
          <span className="text-2xl font-bold text-white">Lovy Calendar</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="px-4 py-2 text-white hover:text-blue-200 transition-colors">
            Sign In
          </Link>
          <Link
            href="/login?signup=true"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">AI-Powered Calendar for the Modern World</h1>
          <p className="text-xl text-blue-100 mb-8">
            Schedule meetings, manage events, and organize your life with our intelligent calendar assistant. Just tell
            it what you need in plain language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/login?signup=true"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-center font-medium flex items-center justify-center gap-2"
            >
              Start for Free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/calendar"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-center font-medium"
            >
              View Demo
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 relative">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
              alt="Calendar app screenshot"
              width={600}
              height={400}
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-500 rounded-full p-2">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-white font-medium">AI Assistant</p>
                </div>
                <p className="text-white/90 text-sm">
                  "Schedule a team meeting tomorrow at 2 PM and a client call on Friday at 11 AM"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          Powerful Features for Busy People
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-colors">
            <div className="bg-blue-500/20 rounded-full p-3 w-fit mb-4">
              <Sparkles className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI-Powered Scheduling</h3>
            <p className="text-blue-100">
              Simply tell our AI what meetings you need, and it will automatically create and organize them in your
              calendar.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-colors">
            <div className="bg-blue-500/20 rounded-full p-3 w-fit mb-4">
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Smart Time Management</h3>
            <p className="text-blue-100">
              Drag and drop events, get intelligent suggestions for scheduling, and never double-book yourself again.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-colors">
            <div className="bg-blue-500/20 rounded-full p-3 w-fit mb-4">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Seamless Collaboration</h3>
            <p className="text-blue-100">
              Share your availability, coordinate with team members, and manage attendees all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-transparent to-black/30">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">Loved by Productive People</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                JD
              </div>
              <div>
                <p className="font-medium text-white">Jane Doe</p>
                <p className="text-sm text-blue-200">Product Manager</p>
              </div>
            </div>
            <p className="text-blue-100">
              "The AI assistant has completely transformed how I schedule meetings. I just tell it what I need and it
              handles everything!"
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                MS
              </div>
              <div>
                <p className="font-medium text-white">Mike Smith</p>
                <p className="text-sm text-blue-200">Entrepreneur</p>
              </div>
            </div>
            <p className="text-blue-100">
              "I've tried dozens of calendar apps, but this is the first one that actually saves me time instead of
              creating more work."
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                AT
              </div>
              <div>
                <p className="font-medium text-white">Alex Taylor</p>
                <p className="text-sm text-blue-200">Team Lead</p>
              </div>
            </div>
            <p className="text-blue-100">
              "Managing a team's schedule used to be a nightmare. Now I just ask the AI to coordinate everything and it
              works perfectly."
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-6">Simple, Transparent Pricing</h2>
        <p className="text-xl text-blue-100 text-center max-w-2xl mx-auto mb-16">
          Start for free and upgrade when you need more powerful features.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Free</h3>
            <p className="text-3xl font-bold text-white mb-6">
              $0<span className="text-lg font-normal text-blue-200">/month</span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span>Basic calendar features</span>
              </li>
              <li className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span>5 AI scheduling requests/month</span>
              </li>
              <li className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span>Personal calendar only</span>
              </li>
            </ul>
            <Link
              href="/login?signup=true"
              className="block w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-center font-medium"
            >
              Get Started
            </Link>
          </div>

          <div className="bg-gradient-to-b from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 transform md:scale-105 md:-translate-y-2 relative">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full">Most Popular</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <p className="text-3xl font-bold text-white mb-6">
              $9.99<span className="text-lg font-normal text-blue-200">/month</span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span>All Free features</span>
              </li>
              <li className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span>Unlimited AI scheduling</span>
              </li>
              <li className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span>Multiple calendars</span>
              </li>
              <li className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span>Advanced event management</span>
              </li>
            </ul>
            <Link
              href="/login?signup=true&plan=pro"
              className="block w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-center font-medium"
            >
              Choose Pro
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Team</h3>
            <p className="text-3xl font-bold text-white mb-6">
              $19.99<span className="text-lg font-normal text-blue-200">/month</span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span>All Pro features</span>
              </li>
              <li className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span>Team collaboration tools</span>
              </li>
              <li className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span>Admin dashboard</span>
              </li>
              <li className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span>Priority support</span>
              </li>
            </ul>
            <Link
              href="/login?signup=true&plan=team"
              className="block w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-center font-medium"
            >
              Choose Team
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur-lg rounded-2xl p-12 border border-blue-500/20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Scheduling?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have simplified their calendar management with our AI-powered assistant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login?signup=true"
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-center font-medium"
            >
              Get Started for Free
            </Link>
            <Link
              href="/calendar"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-center font-medium"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Calendar className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-white">Lovy Calendar</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="text-blue-200 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-blue-200 hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-blue-200 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
        <div className="mt-8 text-center text-blue-300 text-sm">
          © {new Date().getFullYear()} Lovy Calendar. All rights reserved.
        </div>
      </footer>
    </div>
  )
}