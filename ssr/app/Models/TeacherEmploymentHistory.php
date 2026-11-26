<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class TeacherEmploymentHistory extends Model { protected $fillable=['user_id','school_id','role','started_on','ended_on']; protected $casts=['started_on'=>'date','ended_on'=>'date']; }
