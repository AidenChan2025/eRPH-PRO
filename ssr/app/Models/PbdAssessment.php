<?php
namespace App\Models;
use App\Models\Concerns\BelongsToSchoolTenant;
use Illuminate\Database\Eloquent\Model;
class PbdAssessment extends Model { use BelongsToSchoolTenant; protected $fillable=['school_id','student_id','subject','standard','band','evidence','assessed_on','assessed_by']; protected function casts(): array { return ['assessed_on'=>'date','band'=>'integer']; } }
