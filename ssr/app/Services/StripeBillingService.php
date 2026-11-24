<?php

namespace App\Services;

use App\Models\School;
use App\Models\SchoolSubscription;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class StripeBillingService
{
    private const HANDLED_EVENTS = [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_failed',
    ];

    public function isConfigured(): bool
    {
        return filled(config('services.stripe.key'))
            && filled(config('services.stripe.secret'));
    }

    public function isWebhookConfigured(): bool
    {
        return filled(config('services.stripe.webhook_secret'));
    }

    public function priceIdForPlan(string $planCode): ?string
    {
        return match ($planCode) {
            'monthly' => config('services.stripe.price_school_monthly') ?: null,
            'yearly' => config('services.stripe.price_school_yearly') ?: null,
            default => null,
        };
    }

    /**
     * Verify Stripe-Signature header using HMAC-SHA256 and timestamp replay protection.
     */
    public function verifyWebhookSignature(string $payload, string $signatureHeader, ?int $now = null, int $toleranceSeconds = 300): bool
    {
        $secret = (string) config('services.stripe.webhook_secret', '');
        if ($secret === '' || $signatureHeader === '') {
            return false;
        }

        $timestamp = null;
        $signatures = [];
        foreach (explode(',', $signatureHeader) as $part) {
            $kv = explode('=', trim($part), 2);
            if (count($kv) !== 2) {
                continue;
            }
            if ($kv[0] === 't' && ctype_digit($kv[1]) && (int) $kv[1] > 0) {
                $timestamp = (int) $kv[1];
            } elseif ($kv[0] === 'v1' && $kv[1] !== '' && count($signatures) < 10) {
                $signatures[] = $kv[1];
            }
        }

        if ($timestamp === null || $signatures === []) {
            return false;
        }

        $currentTime = $now ?? time();
        if (abs($currentTime - $timestamp) > $toleranceSeconds) {
            return false;
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);
        foreach ($signatures as $candidate) {
            if (hash_equals($expected, $candidate)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Process a signature-verified Stripe webhook payload idempotently with out-of-order protection.
     *
     * @param  array<string, mixed>  $event
     * @return array{received: bool, duplicate: bool, status: string}
     */
    public function handleVerifiedEvent(array $event): array
    {
        $eventId = (string) ($event['id'] ?? '');
        $eventType = (string) ($event['type'] ?? '');
        $eventCreated = is_numeric($event['created'] ?? null) ? max(0, (int) $event['created']) : 0;
        $object = is_array($event['data']['object'] ?? null) ? $event['data']['object'] : [];

        if ($eventId === '' || $eventType === '') {
            return ['received' => true, 'duplicate' => false, 'status' => 'ignored'];
        }

        return DB::transaction(function () use ($eventId, $eventType, $eventCreated, $object) {
            $inserted = DB::table('stripe_webhook_events')->insertOrIgnore([
                'event_id' => $eventId,
                'event_type' => $eventType,
                'school_id' => null,
                'status' => 'processing',
                'processed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($inserted === 0) {
                return ['received' => true, 'duplicate' => true, 'status' => 'duplicate'];
            }

            if ($eventCreated <= 0) {
                DB::table('stripe_webhook_events')->where('event_id', $eventId)->update(['status' => 'ignored']);

                return ['received' => true, 'duplicate' => false, 'status' => 'ignored'];
            }

            if (! in_array($eventType, self::HANDLED_EVENTS, true)) {
                DB::table('stripe_webhook_events')->where('event_id', $eventId)->update(['status' => 'ignored']);

                return ['received' => true, 'duplicate' => false, 'status' => 'ignored'];
            }

            $school = $this->resolveSchoolForEvent($eventType, $object);
            if (! $school) {
                DB::table('stripe_webhook_events')->where('event_id', $eventId)->update(['status' => 'ignored']);

                return ['received' => true, 'duplicate' => false, 'status' => 'ignored'];
            }

            $appliedStatus = $this->applySubscriptionEvent($school, $eventId, $eventType, $eventCreated, $object);

            DB::table('stripe_webhook_events')->where('event_id', $eventId)->update([
                'school_id' => $school->id,
                'status' => $appliedStatus,
                'processed_at' => now(),
            ]);

            return ['received' => true, 'duplicate' => false, 'status' => $appliedStatus];
        });
    }

    /**
     * Create a Stripe Checkout Session for a school subscription with idempotency key.
     *
     * @return array{id: string, url: string}
     */
    public function createCheckoutSession(School $school, string $planCode, string $successUrl, string $cancelUrl): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Stripe API credentials are not configured.');
        }

        $existing = SchoolSubscription::where('school_id', $school->id)->first();
        if ($existing && $existing->status === 'active' && $existing->isActive()) {
            throw new RuntimeException('This school already has an active subscription.');
        }

        $priceId = $this->priceIdForPlan($planCode);
        if (! $priceId) {
            throw new RuntimeException('Selected Stripe plan price is not configured.');
        }

        $payload = [
            'mode' => 'subscription',
            'client_reference_id' => (string) $school->id,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'line_items[0][price]' => $priceId,
            'line_items[0][quantity]' => 1,
            'metadata[school_id]' => (string) $school->id,
            'metadata[plan_code]' => $planCode,
            'subscription_data[metadata][school_id]' => (string) $school->id,
            'subscription_data[metadata][plan_code]' => $planCode,
        ];

        if ($existing?->stripe_customer_id) {
            $payload['customer'] = $existing->stripe_customer_id;
        }

        $idempotencyKey = Str::uuid()->toString();

        $response = Http::asForm()
            ->withToken((string) config('services.stripe.secret'))
            ->withHeaders(['Idempotency-Key' => $idempotencyKey])
            ->timeout(15)
            ->post('https://api.stripe.com/v1/checkout/sessions', $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Stripe Checkout session creation failed.');
        }

        $data = $response->json();
        $url = (string) ($data['url'] ?? '');
        $id = (string) ($data['id'] ?? '');
        if ($url === '' || $id === '') {
            throw new RuntimeException('Stripe Checkout response missing session URL.');
        }

        SchoolSubscription::updateOrCreate(
            ['school_id' => $school->id],
            ['metadata' => array_merge($existing?->metadata ?? [], ['pending_checkout_session_id' => $id])]
        );

        return ['id' => $id, 'url' => $url];
    }

    /**
     * Resolve school strictly from stored Stripe IDs for lifecycle events;
     * allow client_reference_id only for server-initiated checkout.session.completed.
     *
     * @param  array<string, mixed>  $object
     */
    private function resolveSchoolForEvent(string $eventType, array $object): ?School
    {
        $subscriptionId = $this->extractSubscriptionId($object);
        $school = null;
        if ($subscriptionId !== null) {
            $sub = SchoolSubscription::where('stripe_subscription_id', $subscriptionId)->first();
            if ($sub) {
                $school = $sub->school;
            }
        }

        $customerId = is_string($object['customer'] ?? null) ? $object['customer'] : null;
        if (! $school && $customerId !== null && $customerId !== '') {
            $sub = SchoolSubscription::where('stripe_customer_id', $customerId)->latest('id')->first();
            if ($sub) {
                $school = $sub->school;
            }
        }

        if (! $school && $eventType === 'checkout.session.completed') {
            $refId = $object['client_reference_id'] ?? null;
            $metadataSchoolId = $object['metadata']['school_id'] ?? '';
            if (is_numeric($refId) && (string) $metadataSchoolId === (string) $refId) {
                $school = School::find((int) $refId);
            }
        }

        if ($school && $eventType === 'checkout.session.completed') {
            $pendingMetadata = SchoolSubscription::where('school_id', $school->id)->first()?->metadata ?? [];
            $pendingId = $pendingMetadata['pending_checkout_session_id'] ?? null;
            if ($pendingId !== null && (string) ($object['id'] ?? '') !== (string) $pendingId) {
                return null;
            }
        }

        return $school;
    }

    /**
     * @param  array<string, mixed>  $object
     */
    private function extractSubscriptionId(array $object): ?string
    {
        if (is_string($object['subscription'] ?? null) && $object['subscription'] !== '') {
            return $object['subscription'];
        }
        if (is_array($object['subscription'] ?? null) && is_string($object['subscription']['id'] ?? null) && $object['subscription']['id'] !== '') {
            return $object['subscription']['id'];
        }
        if (is_string($object['id'] ?? null) && str_starts_with($object['id'], 'sub_')) {
            return $object['id'];
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $object
     */
    private function applySubscriptionEvent(School $school, string $eventId, string $eventType, int $eventCreated, array $object): string
    {
        // Serialize all subscription creation and updates for a school on the
        // existing parent row. This also closes the missing-subscription race:
        // concurrent deliveries cannot both observe an absent child row.
        School::query()->whereKey($school->getKey())->lockForUpdate()->firstOrFail();
        $subscription = SchoolSubscription::where('school_id', $school->id)->lockForUpdate()->first();
        if (! $subscription) {
            $subscription = new SchoolSubscription(['school_id' => $school->id]);
        }

        $lastCreated = (int) $subscription->last_stripe_event_created;
        $lastEventId = (string) ($subscription->last_stripe_event_id ?? '');
        if ($lastCreated > $eventCreated || ($lastCreated === $eventCreated && $lastEventId !== '' && strcmp($eventId, $lastEventId) <= 0)) {
            return 'stale_ignored';
        }

        if (is_string($object['customer'] ?? null) && $object['customer'] !== '') {
            $subscription->stripe_customer_id = $object['customer'];
        }

        $planCode = $object['metadata']['plan_code'] ?? null;
        if ($eventType === 'checkout.session.completed' && in_array($planCode, ['trial', 'monthly', 'yearly'], true)) {
            $subscription->plan_code = $planCode;
        }

        if ($eventType === 'checkout.session.completed') {
            $subId = $this->extractSubscriptionId($object);
            if ($subId !== null) {
                $subscription->stripe_subscription_id = $subId;
            }
            if (isset($object['current_period_end']) && is_numeric($object['current_period_end'])) {
                $subscription->current_period_end = Carbon::createFromTimestamp((int) $object['current_period_end']);
                $subscription->status = 'active';
            } else {
                // Fail-closed until customer.subscription.updated supplies authoritative period end
                $subscription->status = 'incomplete';
            }
            $subscription->cancel_at_period_end = false;
        } elseif ($eventType === 'customer.subscription.updated') {
            $subId = $this->extractSubscriptionId($object);
            if ($subId !== null) {
                $subscription->stripe_subscription_id = $subId;
            }
            $status = (string) ($object['status'] ?? '');
            $subscription->status = in_array($status, ['trialing', 'active', 'past_due', 'canceled', 'incomplete'], true)
                ? $status
                : 'incomplete';
            if (isset($object['current_period_end']) && is_numeric($object['current_period_end'])) {
                $subscription->current_period_end = Carbon::createFromTimestamp((int) $object['current_period_end']);
            }
            $subscription->cancel_at_period_end = (bool) ($object['cancel_at_period_end'] ?? false);
        } elseif ($eventType === 'customer.subscription.deleted') {
            $subscription->status = 'canceled';
            $subscription->cancel_at_period_end = false;
        } elseif ($eventType === 'invoice.payment_failed') {
            $subscription->status = 'past_due';
        }

        $subscription->last_stripe_event_created = $eventCreated;
        $subscription->last_stripe_event_id = $eventId;

        $subscription->save();

        DB::table('audit_logs')->insert([
            'school_id' => $school->id,
            'actor_id' => null,
            'action' => 'billing.stripe.'.$eventType,
            'subject_type' => SchoolSubscription::class,
            'subject_id' => (string) $subscription->id,
            'context' => json_encode([
                'status' => $subscription->status,
                'plan_code' => $subscription->plan_code,
                'event_created' => $eventCreated,
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return 'processed';
    }
}
