import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Building2, Loader2, Plus } from 'lucide-react';

interface Props {
    timezones?: string[];
    currencies?: string[];
    is_adding?: boolean;  // true when creating a second/additional workspace
}

const FALLBACK_TIMEZONES = ['UTC', 'Africa/Nairobi', 'America/New_York', 'Europe/London', 'Asia/Dubai'];
const FALLBACK_CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'ZAR', 'NGN', 'GHS'];

export default function OnboardingCreate({
    timezones = FALLBACK_TIMEZONES,
    currencies = FALLBACK_CURRENCIES,
    is_adding = false,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name:     '',
        email:    '',
        phone:    '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        currency: 'USD',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/onboarding/create');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <Head title={is_adding ? 'Create New Workspace' : 'Create Your Workspace'} />

            <div className="w-full max-w-md space-y-6">

                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                        {is_adding
                            ? <Plus className="h-7 w-7 text-primary" />
                            : <Building2 className="h-7 w-7 text-primary" />
                        }
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {is_adding ? 'Create a new workspace' : 'Create your workspace'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {is_adding
                            ? 'Each workspace is a separate company with its own data and team.'
                            : "Set up your company's CRM in under a minute."
                        }
                    </p>
                </div>

                {/* Step indicator — only show for first-time onboarding */}
                {!is_adding && (
                    <div className="flex items-center gap-2">
                        {['Account', 'Workspace', 'Module', 'Done'].map((step, i) => (
                            <div key={step} className="flex flex-1 items-center gap-1.5">
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0
                                    ${i === 0 ? 'bg-primary/20 text-primary' : i === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    {i === 0 ? '✓' : i + 1}
                                </div>
                                <span className={`text-xs ${i === 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                    {step}
                                </span>
                                {i < 3 && <div className="flex-1 h-px bg-border" />}
                            </div>
                        ))}
                    </div>
                )}

                {/* Form */}
                <Card className="p-6">
                    <form onSubmit={submit} className="space-y-4">

                        <div className="space-y-1">
                            <Label htmlFor="name">Company / Workspace Name *</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Acme Corp"
                                autoFocus
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="email">Billing Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="billing@acme.com"
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="phone">Phone (optional)</Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                                placeholder="+254 700 000 000"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="timezone">Timezone *</Label>
                                <select
                                    id="timezone"
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    value={data.timezone}
                                    onChange={e => setData('timezone', e.target.value)}
                                >
                                    {timezones.map(tz => (
                                        <option key={tz} value={tz}>{tz}</option>
                                    ))}
                                </select>
                                {errors.timezone && <p className="text-xs text-destructive">{errors.timezone}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="currency">Currency *</Label>
                                <select
                                    id="currency"
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    value={data.currency}
                                    onChange={e => setData('currency', e.target.value)}
                                >
                                    {currencies.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                {errors.currency && <p className="text-xs text-destructive">{errors.currency}</p>}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {is_adding ? 'Create workspace →' : 'Continue →'}
                        </Button>

                        {is_adding && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-muted-foreground"
                                onClick={() => window.history.back()}
                            >
                                Cancel
                            </Button>
                        )}
                    </form>
                </Card>
            </div>
        </div>
    );
}