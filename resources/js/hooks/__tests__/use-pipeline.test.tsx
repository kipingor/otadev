/**
 * Test suite for usePipeline hook
 * Uses:
 *  - Jest
 *  - React Testing Library (renderHook)
 *  - Mock Service Worker (MSW) for API mocking
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { usePipeline } from '../use-pipeline';
import { Lead, Stage } from '@/types';

// ------------------------------
// Mock Data
// ------------------------------
const mockStages: Stage[] = [
    { key: 'new', name: 'New' },
    { key: 'contacted', name: 'Contacted' },
    { key: 'qualified', name: 'Qualified' },
];

const mockLeadsByStage: Record<string, Lead[]> = {
    new: [
        { id: 1, name: 'John Doe', pipeline_stage_key: 'new' },
        { id: 2, name: 'Jane Smith', pipeline_stage_key: 'new' },
    ],
    contacted: [],
    qualified: [],
};

// ------------------------------
// MSW Server Setup
// ------------------------------
const server = setupServer(
    rest.get('/api/v1/pipelines', (_req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                stages: mockStages,
                leadsByStage: mockLeadsByStage,
            })
        );
    }),

    rest.post('/api/v1/pipelines/move', async (req, res, ctx) => {
        const body = await req.json();
        const { lead_id, to_stage_key } = body;

        const movedLead = {
            ...mockLeadsByStage.new.find((l) => l.id === lead_id),
            pipeline_stage_key: to_stage_key,
        };

        return res(ctx.status(200), ctx.json({ updated_lead: movedLead }));
    })
);

// ------------------------------
// Initialize & Teardown
// ------------------------------
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ------------------------------
// Tests
// ------------------------------
describe('usePipeline hook', () => {
    it('loads pipeline data successfully', async () => {
        const { result } = renderHook(() => usePipeline());

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.stages).toHaveLength(3);
        expect(result.current.itemsByStage.new).toHaveLength(2);
    });

    it('handles API failure gracefully', async () => {
        server.use(
            rest.get('/api/v1/pipelines', (_req, res, ctx) => {
                return res(ctx.status(500), ctx.text('Server error'));
            })
        );

        const { result } = renderHook(() => usePipeline());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toContain('Failed');
    });

    it('optimistically moves a lead to a new stage and confirms success', async () => {
        const { result } = renderHook(() => usePipeline({ stages: mockStages, leadsByStage: mockLeadsByStage }));

        // Initial: 2 leads in "new", 0 in "contacted"
        expect(result.current.itemsByStage.new).toHaveLength(2);
        expect(result.current.itemsByStage.contacted).toHaveLength(0);

        await act(async () => {
            await result.current.moveLead({ leadId: 1, toStageKey: 'contacted' });
        });

        expect(result.current.itemsByStage.new).toHaveLength(1);
        expect(result.current.itemsByStage.contacted[0].pipeline_stage_key).toBe('contacted');
    });

    it('rolls back if API move fails', async () => {
        server.use(
            rest.post('/api/v1/pipelines/move', (_req, res, ctx) => res(ctx.status(500), ctx.text('Move failed')))
        );

        const { result } = renderHook(() => usePipeline({ stages: mockStages, leadsByStage: mockLeadsByStage }));

        await act(async () => {
            try {
                await result.current.moveLead({ leadId: 1, toStageKey: 'qualified' });
            } catch {
                // Expected failure
            }
        });

        // After rollback, lead should remain in "new"
        expect(result.current.itemsByStage.new.find((l) => l.id === 1)).toBeTruthy();
    });
});
