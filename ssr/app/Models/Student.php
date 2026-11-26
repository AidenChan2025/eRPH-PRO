<?php
namespace App\Models;
use App\Models\Concerns\BelongsToSchoolTenant;
use Illuminate\Database\Eloquent\Model;
class Student extends Model { use BelongsToSchoolTenant; protected $fillable=['school_id','school_class_id','student_no','name','date_of_birth','gender','status','metadata']; protected function casts(): array { return ['date_of_birth'=>'date','metadata'=>'array']; } }
