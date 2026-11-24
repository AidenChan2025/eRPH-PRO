<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\StripeWebhookEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StripeBillingTest extends TestCase
{
    use RefreshDatabase;

    private function signPayload(string $payload, string $secret, int $timestamp): string
    {
        return "t={$timestamp},v1=".hash_hmac('sha256', $timestamp.'.'.$payload, $secret);
    }

    public function test_stripe_webhook_processes_events_idempotently_and_updates_school_subscription(): void
    {
        $school = School::create([
            'name' => 'SJKC Billing Test',
            'slug' => 'sjkc-billing-test',
            'subdomain' => 'sjkc-billing',
        ]);

        $secret = 'whsec_phase1_billing_secret';
        config()->set('services.stripe.webhook_secret', $secret);
        $ts = time();

        $completedPayload = json_encode([
            'id' => 'evt_checkout_001',
            'created' => $ts,
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'client_reference_id' => (string) $school->id,
                    'customer' => 'cus_test_123',
                    'subscription' => 'sub_test_123',
                    'metadata' => ['school_id' => (string) $school->id, 'plan_code' => 'yearly'],
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $this->call('POST', 'http://erphpro.com/billing/stripe/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_STRIPE_SIGNATURE' => $this->signPayload($completedPayload, $secret, $ts),
        ], $completedPayload)->assertOk()->assertJson(['received' => true, 'duplicate' => false, 'status' => 'processed']);

        // Replay exact same event_id -> idempotent duplicate
        $this->call('POST', 'http://erphpro.com/billing/stripe/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_STRIPE_SIGNATURE' => $this->signPayload($completedPayload, $secret, $ts),
        ], $completedPayload)->assertOk()->assertJson(['received' => true, 'duplicate' => true, 'status' => 'duplicate']);

        $this->assertSame(1, StripeWebhookEvent::where('event_id', 'evt_checkout_001')->count());
        $sub = SchoolSubscription::where('school_id', $school->id)->firstOrFail();
        $this->assertSame('yearly', $sub->plan_code);
        $this->assertSame('incomplete', $sub->status);
        $this->assertSame('cus_test_123', $sub->stripe_customer_id);
        $this->assertSame('sub_test_123', $sub->stripe_subscription_id);

        $updatedPayload = json_encode([
            'id' => 'evt_subscription_updated_001',
            'created' => $ts + 1,
            'type' => 'customer.subscription.updated',
            'data' => ['object' => [
                'id' => 'sub_test_123',
                'customer' => 'cus_test_123',
                'status' => 'active',
                'current_period_end' => time() + 86400,
                'metadata' => ['school_id' => '999999'],
            ]],
        ], JSON_THROW_ON_ERROR);
        $this->call('POST', 'http://erphpro.com/billing/stripe/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_STRIPE_SIGNATURE' => $this->signPayload($updatedPayload, $secret, $ts),
        ], $updatedPayload)->assertOk()->assertJson(['status' => 'processed']);
        $this->assertSame('active', $sub->fresh()->status);
        $this->assertTrue($sub->fresh()->isActive());

        // Payment failed -> past_due
        $failedPayload = json_encode([
            'id' => 'evt_invoice_fail_002',
            'created' => $ts + 2,
            'type' => 'invoice.payment_failed',
            'data' => [
                'object' => [
                    'customer' => 'cus_test_123',
                    'subscription' => 'sub_test_123',
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $this->call('POST', 'http://erphpro.com/billing/stripe/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_STRIPE_SIGNATURE' => $this->signPayload($failedPayload, $secret, $ts),
        ], $failedPayload)->assertOk();

        $this->assertSame('past_due', $sub->fresh()->status);
        $this->assertDatabaseHas('audit_logs', ['school_id' => $school->id, 'action' => 'billing.stripe.invoice.payment_failed']);
    }

    public function test_owner_can_manage_school_billing_and_non_owner_is_forbidden(): void
    {
        $school = School::create([
            'name' => 'SK Owner Billing',
            'slug' => 'sk-owner-billing',
            'subdomain' => 'sk-owner-billing',
        ]);
        $owner = User::factory()->create(['platform_role' => 'owner']);
        $support = User::factory()->create(['platform_role' => 'support']);

        $this->actingAs($support, 'platform')
            ->get('http://erphpro.com/owner/billing')
            ->assertForbidden();

        $this->actingAs($owner, 'platform')
            ->get('http://erphpro.com/owner/billing')
            ->assertOk()
            ->assertSee('SK Owner Billing');

        $this->actingAs($owner, 'platform')
            ->put("http://erphpro.com/owner/billing/{$school->id}", [
                'plan_code' => 'monthly',
                'status' => 'active',
                'reason' => 'Owner-approved billing correction',
            ])
            ->assertRedirect(route('owner.billing'));

        $this->assertDatabaseHas('school_subscriptions', [
            'school_id' => $school->id,
            'plan_code' => 'monthly',
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'school_id' => $school->id,
            'actor_id' => $owner->id,
            'action' => 'platform.billing.updated',
        ]);
        $this->assertSame('Owner-approved billing correction', json_decode(
            (string) \Illuminate\Support\Facades\DB::table('audit_logs')->where('action', 'platform.billing.updated')->value('context'),
            true,
            flags: JSON_THROW_ON_ERROR
        )['reason']);
    }

    public function test_school_admin_can_start_stripe_checkout_when_configured_and_fails_gracefully_when_unconfigured(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();

        config()->set('services.stripe.key', null);
        config()->set('services.stripe.secret', null);

        $this->actingAs($admin)
            ->get('http://demo.erphpro.com/admin/billing')
            ->assertOk()
            ->assertSee('Stripe billing is pending platform configuration.');

        $this->actingAs($admin)
            ->post('http://demo.erphpro.com/admin/billing/checkout', ['plan_code' => 'monthly'])
            ->assertRedirect('http://demo.erphpro.com/admin/billing')
            ->assertSessionHasErrors('stripe');

        $school = School::create(['name' => 'Billing Test School', 'slug' => 'billing-test-school', 'subdomain' => 'billing-test-school', 'is_demo' => false]);
        $admin->schools()->attach($school->id, ['role' => 'school_admin', 'status' => 'active']);
        config()->set('services.stripe.key', 'pk_test_123');
        config()->set('services.stripe.secret', 'sk_test_123');
        config()->set('services.stripe.price_school_monthly', 'price_monthly_123');

        Http::fake([
            'https://api.stripe.com/v1/checkout/sessions' => Http::response([
                'id' => 'cs_test_123',
                'url' => 'https://checkout.stripe.com/c/pay/cs_test_123',
            ], 200),
        ]);

        $this->flushSession();
        $this->actingAs($admin)
            ->post('http://billing-test-school.erphpro.com/admin/billing/checkout', ['plan_code' => 'monthly'])
            ->assertRedirect('https://checkout.stripe.com/c/pay/cs_test_123');

        Http::assertSent(fn ($request) => $request->hasHeader('Idempotency-Key'));
    }

    public function test_billing_webhooks_fail_closed_for_tenant_spoofing_unknown_events_statuses_and_stale_events(): void
    {
        $school = School::create(['name' => 'Billing A', 'slug' => 'billing-a', 'subdomain' => 'billing-a']);
        $other = School::create(['name' => 'Billing B', 'slug' => 'billing-b', 'subdomain' => 'billing-b']);
        $subscription = SchoolSubscription::create([
            'school_id' => $school->id,
            'stripe_customer_id' => 'cus_a',
            'stripe_subscription_id' => 'sub_a',
            'plan_code' => 'monthly',
            'status' => 'active',
            'current_period_end' => now()->addDay(),
            'last_stripe_event_created' => 200,
        ]);

        $service = app(\App\Services\StripeBillingService::class);

        $spoofed = $service->handleVerifiedEvent([
            'id' => 'evt_spoofed', 'type' => 'customer.subscription.updated', 'created' => 201,
            'data' => ['object' => [
                'id' => 'sub_a', 'customer' => 'cus_a', 'status' => 'past_due',
                'current_period_end' => now()->addDay()->timestamp,
                'metadata' => ['school_id' => (string) $other->id],
            ]],
        ]);
        $this->assertSame('processed', $spoofed['status']);
        $this->assertSame('past_due', $subscription->fresh()->status);
        $this->assertSame($school->id, DB::table('audit_logs')->latest('id')->value('school_id'));

        $failed = $service->handleVerifiedEvent([
            'id' => 'evt_failed_spoofed', 'type' => 'invoice.payment_failed', 'created' => 202,
            'data' => ['object' => ['customer' => 'cus_a', 'subscription' => 'sub_a', 'metadata' => ['school_id' => (string) $other->id]]],
        ]);
        $this->assertSame('processed', $failed['status']);
        $this->assertSame('past_due', $subscription->fresh()->status);

        $unknown = $service->handleVerifiedEvent([
            'id' => 'evt_unknown', 'type' => 'customer.unknown', 'created' => 203,
            'data' => ['object' => ['customer' => 'cus_a', 'subscription' => 'sub_a', 'status' => 'canceled']],
        ]);
        $this->assertSame('ignored', $unknown['status']);
        $this->assertSame('past_due', $subscription->fresh()->status);

        $unpaid = $service->handleVerifiedEvent([
            'id' => 'evt_unpaid', 'type' => 'customer.subscription.updated', 'created' => 204,
            'data' => ['object' => ['id' => 'sub_a', 'customer' => 'cus_a', 'status' => 'unpaid']],
        ]);
        $this->assertSame('processed', $unpaid['status']);
        $this->assertSame('incomplete', $subscription->fresh()->status);
        $this->assertFalse($subscription->fresh()->isActive());

        $stale = $service->handleVerifiedEvent([
            'id' => 'evt_stale', 'type' => 'customer.subscription.updated', 'created' => 100,
            'data' => ['object' => ['id' => 'sub_a', 'customer' => 'cus_a', 'status' => 'active', 'current_period_end' => now()->addYear()->timestamp]],
        ]);
        $this->assertSame('stale_ignored', $stale['status']);
        $this->assertSame('incomplete', $subscription->fresh()->status);

        $higherSameSecond = $service->handleVerifiedEvent([
            'id' => 'evt_z_same_second', 'type' => 'customer.subscription.updated', 'created' => 204,
            'data' => ['object' => ['id' => 'sub_a', 'customer' => 'cus_a', 'status' => 'active']],
        ]);
        $this->assertSame('processed', $higherSameSecond['status']);
        $this->assertSame('active', $subscription->fresh()->status);

        $lowerSameSecond = $service->handleVerifiedEvent([
            'id' => 'evt_a_same_second', 'type' => 'customer.subscription.updated', 'created' => 204,
            'data' => ['object' => ['id' => 'sub_a', 'customer' => 'cus_a', 'status' => 'past_due']],
        ]);
        $this->assertSame('stale_ignored', $lowerSameSecond['status']);
        $this->assertSame('active', $subscription->fresh()->status);
    }

    public function test_webhook_with_non_positive_created_timestamp_is_ignored(): void
    {
        $school = School::create(['name' => 'Billing Timestamp', 'slug' => 'billing-timestamp', 'subdomain' => 'billing-timestamp']);

        $result = app(\App\Services\StripeBillingService::class)->handleVerifiedEvent([
            'id' => 'evt_missing_created', 'type' => 'customer.subscription.updated', 'created' => 0,
            'data' => ['object' => ['id' => 'sub_timestamp', 'customer' => 'cus_timestamp', 'status' => 'active']],
        ]);

        $this->assertSame(['received' => true, 'duplicate' => false, 'status' => 'ignored'], $result);
        $this->assertDatabaseHas('stripe_webhook_events', ['event_id' => 'evt_missing_created', 'status' => 'ignored']);
        $this->assertDatabaseMissing('school_subscriptions', ['school_id' => $school->id]);
    }

    public function test_checkout_pending_session_mismatch_is_ignored(): void
    {
        $school = School::create(['name' => 'Billing Pending', 'slug' => 'billing-pending', 'subdomain' => 'billing-pending']);
        SchoolSubscription::create([
            'school_id' => $school->id,
            'metadata' => ['pending_checkout_session_id' => 'cs_expected'],
        ]);

        $result = app(\App\Services\StripeBillingService::class)->handleVerifiedEvent([
            'id' => 'evt_pending_mismatch', 'created' => time(), 'type' => 'checkout.session.completed',
            'data' => ['object' => [
                'id' => 'cs_other',
                'client_reference_id' => (string) $school->id,
                'metadata' => ['school_id' => (string) $school->id, 'plan_code' => 'monthly'],
            ]],
        ]);

        $this->assertSame('ignored', $result['status']);
        $this->assertSame(0, SchoolSubscription::where('school_id', $school->id)->where('status', '!=', 'trialing')->count());
    }

    public function test_checkout_completed_with_mismatched_school_metadata_is_ignored(): void
    {
        $school = School::create(['name' => 'Billing Mismatch', 'slug' => 'billing-mismatch', 'subdomain' => 'billing-mismatch']);

        $result = app(\App\Services\StripeBillingService::class)->handleVerifiedEvent([
            'id' => 'evt_mismatched_checkout', 'created' => time(), 'type' => 'checkout.session.completed',
            'data' => ['object' => [
                'client_reference_id' => (string) $school->id,
                'metadata' => ['school_id' => (string) ($school->id + 1), 'plan_code' => 'monthly'],
            ]],
        ]);

        $this->assertSame('ignored', $result['status']);
        $this->assertDatabaseMissing('school_subscriptions', ['school_id' => $school->id]);
    }

    public function test_owner_manual_activation_sets_a_future_period_end(): void
    {
        $school = School::create(['name' => 'Billing Activation', 'slug' => 'billing-activation', 'subdomain' => 'billing-activation']);
        $owner = User::factory()->create(['platform_role' => 'owner']);

        $this->actingAs($owner, 'platform')->put("http://erphpro.com/owner/billing/{$school->id}", [
            'plan_code' => 'monthly', 'status' => 'active', 'reason' => 'Manual activation correction',
        ])->assertRedirect(route('owner.billing'));

        $subscription = SchoolSubscription::where('school_id', $school->id)->firstOrFail();
        $this->assertTrue($subscription->current_period_end->isFuture());
        $this->assertTrue($subscription->isActive());
    }

    public function test_active_school_is_blocked_from_duplicate_checkout(): void
    {
        $school = School::create(['name' => 'Active Billing', 'slug' => 'active-billing', 'subdomain' => 'active-billing']);
        SchoolSubscription::create([
            'school_id' => $school->id, 'plan_code' => 'monthly', 'status' => 'active',
            'current_period_end' => now()->addDay(),
        ]);
        config()->set('services.stripe.key', 'pk_test');
        config()->set('services.stripe.secret', 'sk_test');
        config()->set('services.stripe.price_school_monthly', 'price_monthly');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('already has an active subscription');
        app(\App\Services\StripeBillingService::class)->createCheckoutSession($school, 'monthly', 'https://success', 'https://cancel');
    }
}
