<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OwnerAccountController extends Controller
{
    private const SCHOOL_ROLES = ['school_admin', 'principal', 'vice_principal', 'teacher', 'inspector'];

    public function index()
    {
        $users = User::query()->whereNull('platform_role')->whereDoesntHave('schools')->orderBy('name')->get(['id', 'name', 'email']);
        $schools = School::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'subdomain']);

        return view('owner.accounts.index', compact('users', 'schools'));
    }

    public function assign(Request $request, User $user, AuditLogger $auditLogger)
    {
        $data = $request->validate([
            'school_id' => ['required', 'integer', Rule::exists('schools', 'id')->where(fn ($query) => $query->where('is_active', true))],
            'role' => ['required', 'in:'.implode(',', self::SCHOOL_ROLES)],
        ]);

        DB::transaction(function () use ($data, $user, $auditLogger): void {
            $lockedUser = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            if ($lockedUser->platform_role !== null || $lockedUser->schools()->exists()) {
                throw ValidationException::withMessages(['user' => 'This account is already assigned or is a platform operator.']);
            }

            $school = School::query()->whereKey($data['school_id'])->where('is_active', true)->lockForUpdate()->firstOrFail();
            $school->members()->attach($lockedUser->id, ['role' => $data['role'], 'status' => 'active', 'joined_at' => now()]);
            $auditLogger->record('platform.account_assigned', $school, User::class, (string) $lockedUser->id, ['role' => $data['role']]);
        });

        return redirect()->route('owner.accounts.index')->with('status', 'Account assigned to the school.');
    }
}
