<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\SchoolSubscription;
use App\Services\StripeBillingService;
use App\Services\DemoSandboxService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use RuntimeException;

class SchoolBillingController extends Controller
{
    public function index(Request $request, StripeBillingService $stripe): View
    {
        /** @var School $school */
        $school = $request->attributes->get('school');
        $subscription = SchoolSubscription::where('school_id', $school->id)->first();

        return view('school.billing', [
            'school' => $school,
            'subscription' => $subscription,
            'stripeConfigured' => $stripe->isConfigured(),
        ]);
    }

    public function checkout(Request $request, StripeBillingService $stripe, DemoSandboxService $sandbox): RedirectResponse
    {
        /** @var School $school */
        $school = $request->attributes->get('school');

        $validated = $request->validate([
            'plan_code' => ['required', 'in:monthly,yearly'],
        ]);

        if ($sandbox->isDemoSchool($school)) {
            return redirect()->route('school.billing')->withErrors(['stripe' => 'Demo schools cannot initiate real Stripe checkout.']);
        }

        if (! $stripe->isConfigured()) {
            return redirect()
                ->route('school.billing')
                ->withErrors(['stripe' => 'Stripe billing is not yet configured by the platform owner.']);
        }

        try {
            $session = $stripe->createCheckoutSession(
                $school,
                $validated['plan_code'],
                route('school.billing', ['checkout' => 'success']),
                route('school.billing', ['checkout' => 'canceled'])
            );
        } catch (RuntimeException $e) {
            return redirect()
                ->route('school.billing')
                ->withErrors(['stripe' => $e->getMessage()]);
        }

        return redirect()->away($session['url']);
    }
}
