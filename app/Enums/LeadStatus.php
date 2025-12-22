<?php

namespace App\Enums;

enum LeadStatus: string
{
    case NEW = 'new';
    case CONTACTED = 'contacted';
    case QUALIFIED = 'qualified';
    case PROPOSAL_SENT = 'proposal_sent';
    case NEGOTIATION = 'negotiation';
    case WON = 'won';
    case LOST = 'lost';
    case ARCHIVED = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::NEW => 'New Lead',
            self::CONTACTED => 'Contacted',
            self::QUALIFIED => 'Qualified',
            self::PROPOSAL_SENT => 'Proposal Sent',
            self::NEGOTIATION => 'In Negotiation',
            self::WON => 'Won',
            self::LOST => 'Lost',
            self::ARCHIVED => 'Archived',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::NEW => 'blue',
            self::CONTACTED => 'cyan',
            self::QUALIFIED => 'green',
            self::PROPOSAL_SENT => 'purple',
            self::NEGOTIATION => 'yellow',
            self::WON => 'emerald',
            self::LOST => 'red',
            self::ARCHIVED => 'gray',
        };
    }

    public function canTransitionTo(self $status): bool
    {
        $transitions = [
            self::NEW => [self::CONTACTED, self::LOST, self::ARCHIVED],
            self::CONTACTED => [self::QUALIFIED, self::LOST, self::ARCHIVED],
            self::QUALIFIED => [self::PROPOSAL_SENT, self::LOST, self::ARCHIVED],
            self::PROPOSAL_SENT => [self::NEGOTIATION, self::LOST, self::ARCHIVED],
            self::NEGOTIATION => [self::WON, self::LOST, self::ARCHIVED],
            self::WON => [self::ARCHIVED],
            self::LOST => [self::ARCHIVED],
            self::ARCHIVED => [],
        ];

        return in_array($status, $transitions[$this] ?? [], true);
    }

    /**
     * Get the timestamp field associated with the status, if any.
     */
    public function timestampField(): ?string
    {
        return match ($this) {
            self::CONTACTED => 'contacted_at',
            self::QUALIFIED => 'qualified_at',
            self::PROPOSAL_SENT => 'proposal_sent_at',
            self::NEGOTIATION => 'negotiation_started_at',
            self::WON => 'won_at',
            self::LOST => 'lost_at',
            self::ARCHIVED => 'archived_at',
            default => null,
        };
    }

    /**
     * Determine if the status is a terminal status.
     */
    public function isTerminal(): bool
    {
        return in_array($this, [self::WON, self::LOST, self::ARCHIVED], true);
    }

    /**
     * Get all active statuses.
     */
    public static function active(): array
    {
        return [
            self::NEW,
            self::CONTACTED,
            self::QUALIFIED,
            self::PROPOSAL_SENT,
            self::NEGOTIATION,
        ];
    }
}
