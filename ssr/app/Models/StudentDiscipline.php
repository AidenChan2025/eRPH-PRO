<?php
namespace App\Models;
use App\Models\Concerns\BelongsToSchoolTenant;
use Illuminate\Database\Eloquent\Model;
class StudentDiscipline extends Model { use BelongsToSchoolTenant; protected $table='student_discipline'; protected $fillable=['school_id','student_id','incident_date','category','description','action_taken','status','recorded_by']; protected function casts(): array { return ['incident_date'=>'date']; } }
