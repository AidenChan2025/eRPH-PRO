<?php
namespace App\Models;
use App\Models\Concerns\BelongsToSchoolTenant; use Illuminate\Database\Eloquent\Model;
class SchoolInvoice extends Model { use BelongsToSchoolTenant; protected $fillable=['school_id','invoice_number','status','currency','amount_minor','issued_on','due_on','paid_at','provider_invoice_id']; protected function casts(): array { return ['issued_on'=>'date','due_on'=>'date','paid_at'=>'datetime','amount_minor'=>'integer']; } }
