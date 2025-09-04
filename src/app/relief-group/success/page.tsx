import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Home } from 'lucide-react'

export default function ReliefGroupSuccessPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </div>
          <CardTitle className="text-navy text-2xl">
            Registration Successful!
          </CardTitle>
          <CardDescription className="text-lg">
            Your relief group has been registered successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-left space-y-3">
            <h3 className="font-semibold text-navy">What happens next?</h3>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                <p>Our team will review your application within 24-48 hours</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                <p>You'll receive an email/SMS notification about the approval</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                <p>Once approved, you'll gain access to task assignments and coordination tools</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                <p>You can start receiving tasks in your operational area</p>
              </div>
            </div>
          </div>

          <div className="bg-accent/5 border border-accent/20 p-4 rounded-md">
            <p className="text-sm text-accent font-medium">
              📱 Keep your phone number active for important updates and task assignments
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/relief-group/register">
                Register Another Group
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t border-muted">
            <p className="text-xs text-muted">
              Need help? Contact our support team or visit our help center.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
