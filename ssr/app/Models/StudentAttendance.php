<?php
namespace App\Models;
use App\Models\Concerns\BelongsToSchoolTenant;
use Illuminate\Database\Eloquent\Model;
class StudentAttendance extends Model { use BelongsToSchoolTenant; protected $table='student_attendance'; protected $fillable=['school_id','student_id','attendance_date','status','reason','recorded_by']; protected function casts(): array { return ['attendance_date'=>'date']; } }
