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

        return response()->json(['received' => true]);
    }
}
