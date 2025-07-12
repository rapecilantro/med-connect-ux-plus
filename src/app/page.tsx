import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { BriefcaseMedical, MapPinned, ShieldCheck, Zap, Target, Lightbulb, UserCheck, Search, FileText, Users, TrendingUp, Clock, CheckCircle, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroCtaButton } from '@/components/landing/hero-cta-button';
import { VideoHero } from '@/components/video-hero';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-secondary/20 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="animate-bounce">
            <BriefcaseMedical className="h-16 w-16 text-primary mx-auto mb-6" />
          </div>
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            � Trusted by Thousands of Patients
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Find Doctors Who Prescribe <span className="text-primary">Your Medication</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Need a specific medication? Find doctors and specialists near you who prescribe it. Search by medication name and location to connect with the right healthcare provider for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <HeroCtaButton />
            <Button variant="outline" size="lg" className="group">
              <Search className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              See How It Works
            </Button>
          </div>
          <VideoHero />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2 group">
              <div className="text-3xl md:text-4xl font-bold group-hover:scale-110 transition-transform duration-300">
                <AnimatedCounter end={25000} suffix="+" />
              </div>
              <div className="text-primary-foreground/80">Doctors Listed</div>
            </div>
            <div className="space-y-2 group">
              <div className="text-3xl md:text-4xl font-bold group-hover:scale-110 transition-transform duration-300">
                <AnimatedCounter end={100000} suffix="+" />
              </div>
              <div className="text-primary-foreground/80">Patient Searches</div>
            </div>
            <div className="space-y-2 group">
              <div className="text-3xl md:text-4xl font-bold group-hover:scale-110 transition-transform duration-300">
                <AnimatedCounter end={500} suffix="+" />
              </div>
              <div className="text-primary-foreground/80">Medications Covered</div>
            </div>
            <div className="space-y-2 group">
              <div className="text-3xl md:text-4xl font-bold group-hover:scale-110 transition-transform duration-300">
                <AnimatedCounter end={50} />
              </div>
              <div className="text-primary-foreground/80">States Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Why Patients Choose Us</h2>
            <p className="text-muted-foreground mb-12 md:mb-16 max-w-xl mx-auto">
              Find the right doctor for your medication needs with our simple, powerful search platform designed specifically for patients.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 bg-card transform hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Find Your Medication</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Search for doctors who prescribe your specific medication by entering the brand name or generic name.
              </CardContent>
            </Card>
            <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 bg-card transform hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block group-hover:scale-110 transition-transform duration-300">
                  <MapPinned className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Near Your Location</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Set your location and preferred distance to find doctors and specialists in your area who can help.
              </CardContent>
            </Card>
            <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 bg-card transform hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Get Results Instantly</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Receive a list of qualified doctors with their contact information and office locations in seconds.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">Helping Patients Connect with Care</h2>
          <p className="text-center text-muted-foreground mb-12 md:mb-16 max-w-xl mx-auto">
            Our platform has helped thousands of patients find the right doctors for their medication needs.
          </p>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-2xl font-bold mb-1 text-foreground">15,000+</h3>
              <p className="text-muted-foreground">Patients Helped</p>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-2xl font-bold mb-1 text-foreground">1 Min</h3>
              <p className="text-muted-foreground">Average Search Time</p>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-2xl font-bold mb-1 text-foreground">98%</h3>
              <p className="text-muted-foreground">Find a Match</p>
            </div>
            <div className="flex flex-col items-center">
              <Star className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-2xl font-bold mb-1 text-foreground">4.8/5</h3>
              <p className="text-muted-foreground">Patient Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Gallery Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">See How Easy It Is</h2>
          <p className="text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
            Our simple interface makes it easy for patients to find doctors who prescribe their needed medications.
          </p>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-foreground">Simple Search</h3>
                <p className="text-muted-foreground mb-4">
                  Just enter your medication name and location. Our system will find doctors who prescribe it in your area.
                </p>
                <Image
                  src="/graphics/Screenshot_2025-06-09_11-27-57.png"
                  alt="Doctor Search Interface for Patients"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg border border-primary/20"
                />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-foreground">Doctor Information</h3>
                <p className="text-muted-foreground mb-4">
                  Get detailed information about each doctor including their practice location, contact details, and specialties.
                </p>
                <Image
                  src="/graphics/Screenshot_2025-06-09_11-29-18.png"
                  alt="Doctor Search Results for Patients"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg border border-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">What Our Patients Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from patients who have successfully found the right doctors for their medication needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card/50 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "I was struggling to find a doctor who could prescribe my ADHD medication after moving to a new city. This site helped me find three doctors within 10 minutes!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Sarah M.</div>
                    <div className="text-xs text-muted-foreground">Austin, TX</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "My insurance changed and I needed to find a new rheumatologist for my arthritis medication. Found a great doctor just 15 minutes from home!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Michael R.</div>
                    <div className="text-xs text-muted-foreground">Denver, CO</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "As a senior citizen, I was worried about finding a doctor who understands my complex medication needs. This service was a lifesaver!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Dorothy L.</div>
                    <div className="text-xs text-muted-foreground">Miami, FL</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Simple Steps to Find Your Doctor
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Finding a doctor who prescribes your medication is easy with our three-step process.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 items-start">
            <div className="group flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-secondary/20">
              <div className="relative">
                <div className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="h-10 w-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Enter Your Medication</h3>
              <p className="text-muted-foreground">Type in the name of the medication you need prescribed - we support both brand names and generic names.</p>
            </div>
            <div className="group flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-secondary/20 md:mt-8">
              <div className="relative">
                <div className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Search className="h-10 w-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Set Your Location</h3>
              <p className="text-muted-foreground">Enter your zip code and choose how far you're willing to travel to find the right doctor.</p>
            </div>
            <div className="group flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-secondary/20 md:mt-16">
              <div className="relative">
                <div className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Contact Your Doctor</h3>
              <p className="text-muted-foreground">Get a list of qualified doctors with their contact information, addresses, and specialties so you can schedule an appointment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Common Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get answers to frequently asked questions about finding doctors for your medications.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-left">How much does it cost to use?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">We offer affordable subscription plans to help patients find doctors. Our pricing includes access to our comprehensive database and search features.</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-left">What if I can't find my medication?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Our database includes thousands of medications. Try searching by generic name, brand name, or contact our support team for assistance.</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-left">Do I need to create an account?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Yes, you'll need to create an account and subscribe to access our doctor search features. This helps us maintain our high-quality database and provide you with accurate results.</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-left">How do I know if a doctor is accepting new patients?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">We provide doctor contact information so you can call their office directly to check availability and schedule appointments.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-tr from-primary/20 via-background to-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              💊 Join 15,000+ Patients Who Found Their Doctor
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Ready to Find Your <span className="text-primary">Perfect Doctor?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Don't spend hours calling doctor offices. Use our platform to quickly find doctors who prescribe your medication and are accepting new patients in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <HeroCtaButton />
              <Button variant="outline" size="lg" className="group">
                <Clock className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Learn More
              </Button>
            </div>
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Affordable Plans
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                No Appointment Needed
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Find Doctors Instantly
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
