<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\User;
use App\Notifications\SchoolInvitationNotification;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Throwable;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class OwnerSchoolController extends Controller
{
    public function index()
    {
        $schools = School::query()->withCount('members')->orderBy('name')->get();
        $pendingInvitations = DB::table('school_memberships')
            ->join('users', 'users.id', '=', 'school_memberships.user_id')
            ->where('school_memberships.status', 'pending')
            ->get(['school_memberships.school_id', 'users.id', 'users.name', 'users.email', 'school_memberships.role'])
            ->groupBy('school_id');

        return view('owner.schools.index', compact('schools', 'pendingInvitations'));
    }

    public function create()
    {
        return view('owner.schools.form', ['school' => new School(), 'mode' => 'create']);
    }

    public function store(Request $request, AuditLogger $auditLogger)
    {
        $data = $this->validated($request);
        $school = DB::transaction(function () use ($data, $auditLogger, $request): School {
            $key = $request->header('Idempotency-Key');
            if ($key && ($existing = School::where('workspace_domain', 'idempotency:'.$key)->first())) {
                return $existing;
            }
            $school = School::create([
                ...$data,
                'slug' => Str::slug($data['name']),
                'is_active' => true,
                'workspace_domain' => $key ? 'idempotency:'.$key : ($data['workspace_domain'] ?? null),
            ]);
            $auditLogger->record('platform.school_created', null, School::class, (string) $school->id, [
                'subdomain' => $school->subdomain,
            ]);

            return $school;
        });

        return redirect()->route('owner.schools.index')->with('status', 'School created.');
    }

    public function edit(School $school)
    {
        return view('owner.schools.form', ['school' => $school, 'mode' => 'edit']);
    }

    public function update(Request $request, School $school, AuditLogger $auditLogger)
    {
        $data = $this->validated($request, $school);
        DB::transaction(function () use ($school, $data, $auditLogger): void {
            $school->update([
                ...$data,
                'slug' => Str::slug($data['name']),
            ]);
            $auditLogger->record('platform.school_updated', null, School::class, (string) $school->id, [
                'subdomain' => $school->subdomain,
            ]);
        });

        return redirect()->route('owner.schools.index')->with('status', 'School updated.');
    }

    public function toggle(School $school, AuditLogger $auditLogger)
    {
        DB::transaction(function () use ($school, $auditLogger): void {
            $school->refresh();
            abort_unless($school->archived_at === null, 422, 'Archived schools must be restored explicitly.');
            $school->update(['is_active' => ! $school->is_active]);
            $auditLogger->record($school->is_active ? 'platform.school_activated' : 'platform.school_suspended', null, School::class, (string) $school->id);
        });

        return redirect()->route('owner.schools.index')->with('status', $school->is_active ? 'School activated.' : 'School suspended.');
    }

    public function restore(School $school, AuditLogger $auditLogger)
    {
        DB::transaction(function () use ($school, $auditLogger): void {
            $lockedSchool = School::query()->whereKey($school->id)->lockForUpdate()->firstOrFail();
            abort_unless($lockedSchool->archived_at !== null, 422, 'Only archived schools can be restored.');
            $lockedSchool->update(['is_active' => true, 'archived_at' => null]);
            $auditLogger->record('platform.school_restored', $lockedSchool, School::class, (string) $lockedSchool->id);
        });

        return redirect()->route('owner.schools.index')->with('status', 'School restored.');
    }

    public function archive(School $school, AuditLogger $auditLogger)
    {
        DB::transaction(function () use ($school, $auditLogger): void {
            $lockedSchool = School::query()->whereKey($school->id)->lockForUpdate()->firstOrFail();
            abort_unless($lockedSchool->archived_at === null, 422, 'School is already archived.');
            $lockedSchool->update(['is_active' => false, 'archived_at' => now()]);
            $auditLogger->record('platform.school_archived', $lockedSchool, School::class, (string) $lockedSchool->id);
        });

        return redirect()->route('owner.schools.index')->with('status', 'School archived.');
    }

    public function inviteAdmin(Request $request, School $school, AuditLogger $auditLogger)
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:190'],
            'name' => ['required', 'string', 'max:120'],
            'role' => ['required', 'in:school_admin,principal,vice_principal,teacher'],
        ]);

        $invitation = DB::transaction(function () use ($data, $school, $auditLogger, $request): array {
            $lockedSchool = School::query()->whereKey($school->id)->lockForUpdate()->firstOrFail();
            abort_unless($lockedSchool->is_active, 422, 'Inactive schools cannot receive invitations.');

            $email = strtolower(trim($data['email']));
            $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->lockForUpdate()->first();
            if (! $user) {
                $user = User::create(['name' => $data['name'], 'email' => $email, 'password' => Str::random(64)]);
            }
            if ($user->platform_role !== null) {
                throw \Illuminate\Validation\ValidationException::withMessages(['email' => 'Platform operators cannot be invited as school members.']);
            }

            $membership = DB::table('school_memberships')->where('school_id', $lockedSchool->id)->where('user_id', $user->id)->lockForUpdate()->first();
            if ($request->header('Idempotency-Key') && $membership && $membership->status === 'pending' && $membership->role === $data['role']) {
                return ['user' => $user, 'school' => $lockedSchool, 'role' => $membership->role, 'idempotent' => true];
            }
            if ($membership && in_array($membership->status, ['active', 'pending'], true)) {
                throw \Illuminate\Validation\ValidationException::withMessages(['email' => 'This account already has an active or pending school membership.']);
            }

            $attributes = ['role' => $data['role'], 'status' => 'pending', 'joined_at' => null, 'left_at' => null];
            if ($membership) {
                $lockedSchool->members()->updateExistingPivot($user->id, $attributes);
            } else {
                $lockedSchool->members()->attach($user->id, $attributes);
            }
            $auditLogger->record('platform.school_admin_invited', $lockedSchool, User::class, (string) $user->id, ['email' => $email, 'role' => $data['role'], 'status' => 'pending']);

            return ['user' => $user, 'school' => $lockedSchool, 'role' => $data['role'], 'idempotent' => false];
        });

        if ($invitation['idempotent']) {
            return redirect()->route('owner.schools.index')->with('status', 'Invitation already recorded.');
        }

        $emailStatus = 'email notification sent';
        try {
            Notification::route('mail', $invitation['user']->email)
                ->notify(new SchoolInvitationNotification($invitation['school'], $invitation['role']));
        } catch (Throwable $exception) {
            report($exception);
            $emailStatus = 'email notification could not be delivered; the pending invitation remains available for retry';
            $auditLogger->record('platform.school_invitation_email_failed', $invitation['school'], User::class, (string) $invitation['user']->id, ['email' => $invitation['user']->email]);
        }

        return redirect()->route('owner.schools.index')->with('status', 'Invitation recorded; '.$emailStatus.'. The user must sign in with this email from the school workspace.');
    }

    public function revokeInvitation(School $school, User $user, AuditLogger $auditLogger)
    {
        DB::transaction(function () use ($school, $user, $auditLogger): void {
            $membership = DB::table('school_memberships')
                ->where('school_id', $school->id)->where('user_id', $user->id)->lockForUpdate()->first();
            abort_unless($membership && $membership->status === 'pending', 404);
            DB::table('school_memberships')->where('school_id', $school->id)->where('user_id', $user->id)->update([
                'status' => 'revoked', 'left_at' => now(), 'updated_at' => now(),
            ]);
            $auditLogger->record('platform.school_invitation_revoked', $school, User::class, (string) $user->id, ['email' => $user->email]);
        });

        return redirect()->route('owner.schools.index')->with('status', 'Pending invitation revoked.');
    }

    public function resendInvitation(School $school, User $user, AuditLogger $auditLogger)
    {
        $membership = DB::table('school_memberships')->where('school_id', $school->id)->where('user_id', $user->id)->lockForUpdate()->first();
        abort_unless($membership && $membership->status === 'pending' && $school->is_active, 404);

        $emailStatus = 'email notification resent';
        try {
            Notification::route('mail', $user->email)->notify(new SchoolInvitationNotification($school, $membership->role));
            $auditLogger->record('platform.school_invitation_resent', $school, User::class, (string) $user->id, ['email' => $user->email, 'role' => $membership->role]);
        } catch (Throwable $exception) {
            report($exception);
            $emailStatus = 'email notification could not be delivered';
            $auditLogger->record('platform.school_invitation_email_failed', $school, User::class, (string) $user->id, ['email' => $user->email, 'retry' => true]);
        }

        return redirect()->route('owner.schools.index')->with('status', ucfirst($emailStatus).'.');
    }

    private function validated(Request $request, ?School $school = null): array
    {
        return $request->validate([
            'name' => [
                'required', 'string', 'max:120',
                function (string $attribute, mixed $value, \Closure $fail) use ($school): void {
                    $slug = Str::slug((string) $value);
                    $query = School::query()->where('slug', $slug);
                    if ($school) {
                        $query->where('id', '!=', $school->id);
                    }
                    if ($slug === '' || $query->exists()) {
                        $fail('This school name would produce a duplicate school slug.');
                    }
                },
            ],
            'subdomain' => [
                'required', 'string', 'max:63', 'regex:/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/',
                Rule::notIn(config('app.reserved_school_subdomains', [])),
                Rule::unique('schools', 'subdomain')->ignore($school?->id),
            ],
            'workspace_domain' => ['nullable', 'string', 'max:190'],
        ]);
    }
}
