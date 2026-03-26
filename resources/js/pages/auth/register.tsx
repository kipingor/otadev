import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2, Users, Columns, BookUser } from 'lucide-react';

/**
 * Register page — framed as the first step of onboarding.
 *
 * After successful registration, Fortify redirects to /dashboard.
 * EnsureActiveTenant detects no tenant and redirects to /onboarding/create.
 * The user then completes workspace setup and module selection.
 *
 * This page makes that flow explicit so users understand what comes next.
 */
export default function Register() {
    return (
        <div className="min-h-screen flex">

            {/* ── Left: registration form ───────────────────────────────── */}
            <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-12 xl:px-16">
                <div className="mx-auto w-full max-w-sm">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5 mb-10">
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

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mb-8">
                        {['Account', 'Workspace', 'Module'].map((step, i) => (
                            <div key={step} className="flex flex-1 items-center gap-1.5">
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0
                                    ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    {i + 1}
                                </div>
                                <span className={`text-xs ${i === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                    {step}
                                </span>
                                {i < 2 && <div className="flex-1 h-px bg-border" />}
                            </div>
                        ))}
                    </div>

                    <Head title="Create your account" />

                    <h1 className="text-2xl font-bold tracking-tight mb-1">Create your account</h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Start free. Set up your workspace in the next step.
                    </p>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password', 'password_confirmation']}
                        disableWhileProcessing
                        className="flex flex-col gap-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-5">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="name">Full name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="name"
                                            name="name"
                                            placeholder="Jane Smith"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="email">Work email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            tabIndex={2}
                                            autoComplete="email"
                                            name="email"
                                            placeholder="jane@company.com"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            tabIndex={3}
                                            autoComplete="new-password"
                                            name="password"
                                            placeholder="Min. 8 characters"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="password_confirmation">Confirm password</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            required
                                            tabIndex={4}
                                            autoComplete="new-password"
                                            name="password_confirmation"
                                            placeholder="Repeat your password"
                                        />
                                        <InputError message={errors.password_confirmation} />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    tabIndex={5}
                                    disabled={processing}
                                >
                                    {processing && <Spinner className="mr-2" />}
                                    Create account & continue →
                                </Button>

                                <p className="text-center text-xs text-muted-foreground">
                                    By creating an account you agree to our{' '}
                                    <a href="#" className="underline hover:text-foreground">Terms</a>
                                    {' '}and{' '}
                                    <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
                                </p>

                                <p className="text-center text-sm text-muted-foreground">
                                    Already have an account?{' '}
                                    <TextLink href={login()} tabIndex={6}>Sign in</TextLink>
                                </p>
                            </>
                        )}
                    </Form>
                </div>
            </div>

            {/* ── Right: onboarding preview ─────────────────────────────── */}
            <div className="hidden lg:flex flex-1 flex-col justify-center bg-muted/30 border-l px-12 xl:px-16">
                <div className="max-w-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
                        What happens next
                    </p>

                    <div className="space-y-8">
                        {[
                            {
                                step: 2,
                                title: 'Set up your workspace',
                                desc: 'Name your company, set your timezone and currency.',
                                icon: '🏢',
                            },
                            {
                                step: 3,
                                title: 'Pick your free module',
                                desc: 'Choose one of three free modules to start with. Add more on any paid plan.',
                                icon: '🧩',
                            },
                            {
                                step: null,
                                title: 'You\'re in!',
                                desc: 'Access your dashboard. Invite your team. Upgrade whenever you need more.',
                                icon: '🚀',
                            },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="text-xl flex-shrink-0 w-8 text-center">{item.icon}</div>
                                <div>
                                    <p className="font-semibold text-sm">
                                        {item.step && <span className="text-primary mr-1.5">Step {item.step}.</span>}
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Free modules teaser */}
                    <div className="mt-12 p-5 rounded-xl border bg-card/50">
                        <p className="text-xs font-semibold text-muted-foreground mb-4">Your 3 free module options</p>
                        <div className="space-y-3">
                            {[
                                { icon: Users,    name: 'Lead Management', desc: 'Capture & track leads' },
                                { icon: Columns,  name: 'Pipeline & Kanban', desc: 'Visual deal board' },
                                { icon: BookUser, name: 'Contact Management', desc: 'All your contacts' },
                            ].map(mod => (
                                <div key={mod.name} className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                                        <mod.icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium leading-none">{mod.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{mod.desc}</p>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            ✦ Free forever · No credit card required
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}