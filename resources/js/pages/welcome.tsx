import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Zap, Shield, Users, BarChart3 } from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    const features = [
        {
            icon: Zap,
            title: "Lightning Fast",
            description: "Built with modern technologies for optimal performance"
        },
        {
            icon: Shield,
            title: "Secure by Default",
            description: "Enterprise-grade security with built-in authentication"
        },
        {
            icon: Users,
            title: "Team Collaboration",
            description: "Powerful tools for team management and collaboration"
        },
        {
            icon: BarChart3,
            title: "Analytics & Insights",
            description: "Comprehensive dashboard with real-time analytics"
        }
    ];

    return (
        <>
            <Head title="Welcome to OTA Development">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                {/* Navigation */}
                <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                </svg>
                            </div>
                            <div>
                                <h1 className="font-semibold text-foreground">OTA Development</h1>
                                <p className="text-xs text-muted-foreground">Business Solutions</p>
                            </div>
                        </div>
                        
                        <nav className="flex items-center gap-2">
                        {auth.user ? (
                                <Button asChild>
                                    <Link href={dashboard()}>
                                Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" asChild>
                                        <Link href={login()}>Log in</Link>
                                    </Button>
                                    {canRegister && (
                                        <Button asChild>
                                            <Link href={register()}>Get Started</Link>
                                        </Button>
                                    )}
                                </div>
                        )}
                    </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="container py-24 lg:py-32">
                    <div className="mx-auto max-w-4xl text-center">
                        <Badge variant="secondary" className="mb-4">
                            🚀 Now Available
                        </Badge>
                        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                            Build Better
                            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                {" "}Business Solutions
                            </span>
                            </h1>
                        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                            Streamline your business operations with our comprehensive platform. 
                            From lead management to project tracking, we've got everything you need.
                        </p>
                        
                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                            {!auth.user ? (
                                <>
                                    <Button size="lg" asChild>
                                        <Link href={register()}>
                                            Get Started Free
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild>
                                        <Link href={login()}>
                                            Sign In
                                        </Link>
                                    </Button>
                                </>
                            ) : (
                                <Button size="lg" asChild>
                                    <Link href={dashboard()}>
                                        Go to Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </main>

                {/* Features Section */}
                <section className="container py-24">
                    <div className="mx-auto max-w-4xl text-center mb-16">
                        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                            Everything you need to succeed
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Powerful features designed to help your business grow and thrive
                        </p>
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-0 bg-card/50 backdrop-blur">
                                <CardHeader className="pb-4">
                                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>{feature.description}</CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="container py-24">
                    <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
                        <div>
                            <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
                                Why choose OTA Development?
                            </h2>
                            <div className="space-y-4">
                                {[
                                    "Complete business management solution",
                                    "Real-time analytics and reporting",
                                    "Seamless team collaboration tools",
                                    "Enterprise-grade security",
                                    "24/7 customer support",
                                    "Easy integration with existing tools"
                                ].map((benefit, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-primary" />
                                        <span className="text-muted-foreground">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                            <CardHeader>
                                <CardTitle>Ready to get started?</CardTitle>
                                <CardDescription>
                                    Join thousands of businesses already using our platform
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">✓ Free 14-day trial</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">✓ No credit card required</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">✓ Cancel anytime</Badge>
                                </div>
                                {!auth.user && (
                                    <Button className="w-full" asChild>
                                        <Link href={register()}>
                                            Start Free Trial
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t bg-muted/50">
                    <div className="container py-12">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="flex items-center space-x-2">
                                <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                                </div>
                                <span className="font-semibold">OTA Development</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                © 2024 OTA Development. All rights reserved.
                            </p>
                        </div>
                </div>
                </footer>
            </div>
        </>
    );
}