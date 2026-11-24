<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\SchoolSubscription;
use App\Services\StripeBillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class OwnerBillingController extends Controller
{
    public function index(StripeBillingService $stripe): View
    {
        $schools = School::query()
            ->orderBy('name')
            ->get();

        $subscriptions = SchoolSubscription::query()
            ->get()
            ->keyBy('school_id');

        return view('owner.billing', [
            'schools' => $schools,
            'subscriptions' => $subscriptions,
            'stripeConfigured' => $stripe->isConfigured(),
            'webhookConfigured' => $stripe->isWebhookConfigured(),
        ]);
    }

    public function update(Request $request, School $school): RedirectResponse
    {
        $validated = $request->validate([
            'plan_code' => ['required', 'in:trial,monthly,yearly'],
            'status' => ['required', 'in:trialing,active,past_due,canceled,incomplete'],
            'reason' => ['required', 'string', 'min:3', 'max:255'],
        ]);

        DB::transaction(function () use ($request, $school, $validated) {
            $subscription = SchoolSubscription::updateOrCreate(
                ['school_id' => $school->id],
                [
                    'plan_code' => $validated['plan_code'],
                    'status' => $validated['status'],
                ]
            );

            if (in_array($validated['status'], ['active', 'trialing'], true)
                && ($subscription->current_period_end === null || $subscription->current_period_end->isPast())) {
                $subscription->current_period_end = match ($validated['plan_code']) {
                    'trial' => now()->addDays(14),
                    'monthly' => now()->addMonth(),
                    'yearly' => now()->addYear(),
                };
                $subscription->save();
            }

            DB::table('audit_logs')->insert([
                'school_id' => $school->id,
                'actor_id' => $request->user('platform')?->id,
                'action' => 'platform.billing.updated',
                'subject_type' => SchoolSubscription::class,
                'subject_id' => (string) $subscription->id,
                'context' => json_encode($validated, JSON_THROW_ON_ERROR),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return redirect()->route('owner.billing')->with('status', 'School subscription updated.');
    }
}
