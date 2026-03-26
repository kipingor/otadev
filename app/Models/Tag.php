<?php

namespace App\Models;

use App\Models\Concerns\HasTenantScope;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    use HasTenantScope;
    protected $fillable = [
'tenant_id',
'name', 'color'];

    // ── Relations ─────────────────────────────────────────────────────────────

    /**
     * All leads that have this tag.
     * Uses the lead_tag direct pivot (same table the Lead model uses).
     */
    public function leads(): BelongsToMany
    {
        return $this->belongsToMany(Lead::class, 'lead_tag');
    }

    /**
     * All projects that have this tag.
     * Requires a project_tag pivot migration if used.
     * Left as a stub to avoid breaking existing code references.
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_tag');
    }
}