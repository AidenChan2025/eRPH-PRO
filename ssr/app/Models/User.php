<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'google_subject',
        'platform_role',
        'platform_mfa_secret',
        'platform_mfa_confirmed_at',
        'platform_mfa_recovery_codes',
        'platform_mfa_recovery_codes_generated_at',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'platform_mfa_secret',
        'platform_mfa_recovery_codes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'platform_mfa_confirmed_at' => 'datetime',
            'platform_mfa_recovery_codes_generated_at' => 'datetime',
        ];
    }

    public function schools(): BelongsToMany
    {
        return $this->belongsToMany(School::class, 'school_memberships')
            ->withPivot(['role', 'status', 'joined_at', 'left_at', 'expires_at', 'access_reason'])
            ->withTimestamps();
    }

    public function googleIdentities(): HasMany
    {
        return $this->hasMany(GoogleIdentity::class)->whereNull('unlinked_at');
    }
}
