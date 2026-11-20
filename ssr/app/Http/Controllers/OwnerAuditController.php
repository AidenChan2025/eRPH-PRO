<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class OwnerAuditController extends Controller
{
    public function __invoke()
    {
        $logs = DB::table('audit_logs')
            ->leftJoin('schools', 'schools.id', '=', 'audit_logs.school_id')
            ->leftJoin('users', 'users.id', '=', 'audit_logs.actor_id')
            ->select('audit_logs.*', 'schools.name as school_name', 'users.name as actor_name')
            ->latest('audit_logs.created_at')
            ->limit(100)
            ->get();

        return view('owner.audit', compact('logs'));
    }
}
