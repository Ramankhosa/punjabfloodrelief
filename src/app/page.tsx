import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Heart, MapPin } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-muted bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-bold text-navy">Punjab Flood Relief</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-navy mb-6">
            Connecting Punjab in Crisis
          </h1>
          <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
            A centralized platform for flood relief coordination, connecting people in need
            with relief workers, volunteers, and emergency services across Punjab.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Join the Network
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">
                Access Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-navy mb-4">How We Help</h2>
          <p className="text-muted max-w-2xl mx-auto">
            Our platform bridges the gap between those affected by floods and the relief efforts
            working tirelessly to provide assistance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Relief Coordination</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect relief organizations, volunteers, and emergency services
                for efficient coordination and resource allocation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Location Services</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                GPS-enabled location services to identify areas most in need
                and coordinate rescue operations effectively.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Emergency Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Quick access to emergency contacts, medical aid, and immediate
                assistance for those affected by flooding.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Verified Network</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All relief workers and organizations are verified through
                our secure registration and moderation process.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-navy text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of volunteers, relief workers, and organizations working together
            to provide support during Punjab's flood crisis.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/signup">
              Start Helping Today
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-muted py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-accent" />
            <span className="font-semibold text-navy">Punjab Flood Relief</span>
          </div>
          <p className="text-sm text-muted">
            © 2024 Punjab Flood Relief Network. Built for crisis response and community support.
          </p>
        </div>
      </footer>
    </div>
  )
}
