<?php
namespace App\Models;

use App\Models\Concerns\HasTenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use SoftDeletes, HasTenantScope;
    protected $fillable = [
'tenant_id',
'supplier_id','name','sku','description','category','unit','unit_cost','unit_price','stock_qty','active','metadata'];
    protected $casts = ['unit_cost'=>'decimal:2','unit_price'=>'decimal:2','stock_qty'=>'integer','active'=>'boolean','metadata'=>'array'];
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function margin(): float { return $this->unit_cost > 0 ? round((($this->unit_price - $this->unit_cost) / $this->unit_cost) * 100, 1) : 0; }
}