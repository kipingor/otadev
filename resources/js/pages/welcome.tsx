import { login, register } from '@/routes';
import { dashboard } from '@/routes/web';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowRight, CheckCircle2, Users, BarChart3, Folder, Receipt,
    Target, Truck, UserCog, Columns, BookUser, Building2,
    Shield, Zap, Globe, Star, ChevronRight,
} from 'lucide-react';

// ── Module definitions ────────────────────────────────────────────────────────

const modules = [
    { icon: Users,     key: 'leads',         name: 'Lead Management',       desc: 'Capture and track leads through your pipeline', free: true },
    { icon: Columns,   key: 'pipeline',       name: 'Pipeline & Kanban',     desc: 'Visual kanban board for deal stages', free: true },
    { icon: BookUser,  key: 'contacts',       name: 'Contact Management',    desc: 'Centralise all contacts and companies', free: true },
    { icon: Target,    key: 'opportunities',  name: 'Opportunities',         desc: 'Track revenue opportunities to close' },
    { icon: Folder,    key: 'projects',       name: 'Project Management',    desc: 'PMBOK-compliant projects with WBS & milestones' },
    { icon: Receipt,   key: 'accounting',     name: 'Invoices & Accounting', desc: 'IFRS-compliant billing and expense tracking' },
    { icon: Building2, key: 'clients',        name: 'Client CRM',            desc: 'Full client relationship management' },
    { icon: BarChart3, key: 'analytics',      name: 'Analytics',             desc: 'Advanced dashboards and performance reporting' },
    { icon: Truck,     key: 'supply_chain',   name: 'Supply Chain',          desc: 'Purchase orders, deliveries and suppliers' },
    { icon: UserCog,   key: 'hr',             name: 'HR & Leave',            desc: 'Employee records and leave management' },
];

// ── Pricing plans ─────────────────────────────────────────────────────────────

const plans = [
    {
        name: 'Free',
        price: 0,
        users: 1,
        modules: 1,
        features: ['1 user seat', '1 free module of your choice', '14-day full-access trial'],
        cta: 'Start Free',
        highlight: false,
    },
    {
        name: 'Starter',
        price: 29,
        users: 5,
        modules: 3,
        features: ['Up to 5 users', 'Any 3 modules', 'Email support', 'Basic analytics'],
        cta: 'Start Starter',
        highlight: false,
    },
    {
        name: 'Growth',
        price: 79,
        users: 15,
        modules: 'All',
        features: ['Up to 15 users', 'All 10 modules', 'Priority support', 'Advanced analytics', 'Supply chain'],
        cta: 'Start Growth',
        highlight: true,
    },
    {
        name: 'Enterprise',
        price: 199,
        users: 'Unlimited',
        modules: 'All',
        features: ['Unlimited users', 'All modules + HR', 'Dedicated support', 'Custom domain', 'SLA guarantee'],
        cta: 'Contact Sales',
        highlight: false,
    },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="OTA Development — Business CRM & Project Management">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-background font-sans antialiased">

                {/* ── Navigation ───────────────────────────────────────────── */}
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold leading-none">OTA Development</p>
                                <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Business Platform</p>
                            </div>
                        </div>

                        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                            <a href="#modules" className="hover:text-foreground transition-colors">Modules</a>
                            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
                            <a href="#why" className="hover:text-foreground transition-colors">Why OTA</a>
                        </nav>

                        <div className="flex items-center gap-2">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href={dashboard()}>Dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={login()}>Sign in</Link>
                                    </Button>
                                    {canRegister && (
                                        <Button size="sm" asChild>
                                            <Link href={register()}>Get started free</Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Hero ─────────────────────────────────────────────────── */}
                <section className="container py-24 lg:py-32">
                    <div className="mx-auto max-w-4xl text-center">
                        <Badge variant="secondary" className="mb-6 px-3 py-1">
                            ✦ 14-day free trial · No credit card required
                        </Badge>

                        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                            One platform for your{' '}
                            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                                entire business
                            </span>
                        </h1>

                        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
                            From leads to invoices to projects — OTA Development brings everything together
                            in one IFRS-compliant, multi-tenant platform built for African businesses.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {!auth.user ? (
                                <>
                                    <Button size="lg" asChild className="min-w-44">
                                        <Link href={register()}>
                                            Start free — pick your module
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild>
                                        <Link href={login()}>Sign in to your account</Link>
                                    </Button>
                                </>
                            ) : (
                                <Button size="lg" asChild>
                                    <Link href={dashboard()}>Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            )}
                        </div>

                        {/* Social proof strip */}
                        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                            {[
                                { icon: Shield, text: 'IFRS compliant accounting' },
                                { icon: Globe, text: 'Multi-currency (KES, USD, EUR+)' },
                                { icon: Zap, text: 'Set up in under 2 minutes' },
                            ].map(item => (
                                <div key={item.text} className="flex items-center gap-1.5">
                                    <item.icon className="h-4 w-4 text-primary" />
                                    <span>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Modules ──────────────────────────────────────────────── */}
                <section id="modules" className="container py-24">
                    <div className="mx-auto max-w-3xl text-center mb-14">
                        <h2 className="text-3xl font-bold sm:text-4xl mb-4">Choose what you need</h2>
                        <p className="text-lg text-muted-foreground">
                            Start free with one module. Add more as you grow.
                            Every module works together seamlessly.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {modules.map(mod => (
                            <Card key={mod.key} className={`relative transition-all hover:shadow-md hover:border-primary/40 ${mod.free ? 'border-primary/30 bg-primary/[0.02]' : ''}`}>
                                {mod.free && (
                                    <div className="absolute -top-2.5 left-4">
                                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-semibold">Free</Badge>
                                    </div>
                                )}
                                <CardHeader className="pb-2 pt-5">
                                    <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${mod.free ? 'bg-primary/10' : 'bg-muted'}`}>
                                        <mod.icon className={`h-4.5 w-4.5 ${mod.free ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                    <CardTitle className="text-sm font-semibold">{mod.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="text-xs text-muted-foreground leading-relaxed">{mod.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-8">
                        ✦ 3 modules free to start · All 10 available on Growth & Enterprise
                    </p>
                </section>

                {/* ── Pricing ──────────────────────────────────────────────── */}
                <section id="pricing" className="bg-muted/30 py-24">
                    <div className="container">
                        <div className="mx-auto max-w-2xl text-center mb-14">
                            <h2 className="text-3xl font-bold sm:text-4xl mb-4">Simple, transparent pricing</h2>
                            <p className="text-lg text-muted-foreground">
                                Start free forever. Upgrade when you're ready.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {plans.map(plan => (
                                <Card
                                    key={plan.name}
                                    className={`relative flex flex-col ${plan.highlight ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''}`}
                                >
                                    {plan.highlight && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-primary text-primary-foreground px-3 text-xs font-semibold">
                                                Most popular
                                            </Badge>
                                        </div>
                                    )}
                                    <CardHeader className="pb-4 pt-6">
                                        <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{plan.name}</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            {plan.price === 0 ? (
                                                <span className="text-3xl font-bold">Free</span>
                                            ) : (
                                                <>
                                                    <span className="text-3xl font-bold">${plan.price}</span>
                                                    <span className="text-muted-foreground text-sm">/mo</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                                            <span>{typeof plan.users === 'number' ? `${plan.users} user${plan.users > 1 ? 's' : ''}` : plan.users}</span>
                                            <span>·</span>
                                            <span>{typeof plan.modules === 'number' ? `${plan.modules} module${plan.modules > 1 ? 's' : ''}` : `${plan.modules} modules`}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex flex-col flex-1 gap-4">
                                        <ul className="space-y-2 flex-1">
                                            {plan.features.map(f => (
                                                <li key={f} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                    <span className="text-muted-foreground">{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {canRegister && !auth.user && (
                                            <Button
                                                asChild
                                                className="w-full"
                                                variant={plan.highlight ? 'default' : 'outline'}
                                            >
                                                <Link href={plan.cta === 'Contact Sales' ? 'mailto:hello@otadevelopment.com' : register()}>
                                                    {plan.cta}
                                                </Link>
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <p className="text-center text-sm text-muted-foreground mt-8">
                            All plans include a 14-day trial of full Growth features · Cancel anytime
                        </p>
                    </div>
                </section>

                {/* ── Why OTA ──────────────────────────────────────────────── */}
                <section id="why" className="container py-24">
                    <div className="grid gap-16 lg:grid-cols-2 items-center">
                        <div>
                            <h2 className="text-3xl font-bold sm:text-4xl mb-6">
                                Built for African businesses.<br />Ready for the world.
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { title: 'IFRS-Compliant Accounting', desc: 'Full double-entry bookkeeping with P&L, Balance Sheet, Cash Flow statements. IAS 21 multi-currency support with KES, USD, EUR and more.' },
                                    { title: 'Multi-Currency Native', desc: 'Invoice in any currency, collect in M-Pesa, bank transfer, or card. Exchange rates tracked per transaction.' },
                                    { title: 'PMBOK Project Management', desc: 'Full PMBOK 6th Edition compliance with WBS, risk register, change control, stakeholder management, and earned value metrics.' },
                                    { title: 'Multi-Tenant by Design', desc: 'Run multiple companies from one account. Switch workspaces in one click. Each company\'s data is completely isolated.' },
                                ].map(item => (
                                    <div key={item.title} className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm">{item.title}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Card className="p-8 bg-gradient-to-br from-primary/5 to-muted/30 border-primary/20">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-2xl font-bold">Start in 3 steps</p>
                                    <p className="text-muted-foreground mt-1">No setup fees. No credit card.</p>
                                </div>
                                {[
                                    { step: '1', title: 'Create your account', desc: 'Name, email, password — takes 30 seconds' },
                                    { step: '2', title: 'Set up your workspace', desc: 'Company name, timezone and currency' },
                                    { step: '3', title: 'Pick your free module', desc: 'Choose the tool that matters most to you right now' },
                                ].map(item => (
                                    <div key={item.step} className="flex gap-4">
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                            {item.step}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                                {!auth.user && canRegister && (
                                    <Button asChild className="w-full mt-2">
                                        <Link href={register()}>
                                            Get started now — it's free
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </div>
                </section>

                {/* ── Footer ───────────────────────────────────────────────── */}
                <footer className="border-t bg-muted/30">
                    <div className="container py-10">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                    </svg>
                                </div>
                                <span className="font-semibold">OTA Development</span>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <Link href={login()} className="hover:text-foreground transition-colors">Sign in</Link>
                                {canRegister && <Link href={register()} className="hover:text-foreground transition-colors">Register</Link>}
                                <a href="mailto:hello@otadevelopment.com" className="hover:text-foreground transition-colors">Contact</a>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                © {new Date().getFullYear()} OTA Development. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}