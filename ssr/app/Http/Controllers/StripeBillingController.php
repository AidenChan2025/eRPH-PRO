<?php

namespace App\Http\Controllers;

use App\Services\StripeBillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StripeBillingController extends Controller
{
    public function webhook(Request $request, StripeBillingService $stripe): JsonResponse
    {
        if (! $stripe->isWebhookConfigured()) {
            return response()->json(['error' => 'Stripe webhook not configured'], 503);
        }

        $payload = $request->getContent();
        $signature = (string) $request->header('Stripe-Signature', '');

        if (! $stripe->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['error' => 'Invalid Stripe signature'], 400);
        }

        $event = json_decode($payload, true);
        if (! is_array($event)) {
            return response()->json(['error' => 'Invalid JSON payload'], 400);
        }

        $result = $stripe->handleVerifiedEvent($event);

        return response()->json($result);
    }
}
