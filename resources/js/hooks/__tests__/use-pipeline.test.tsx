/**
 * Test suite for usePipeline hook
 * Uses:
 *  - Jest
 *  - React Testing Library (renderHook)
 *  - Mock Service Worker (MSW) for API mocking
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { beforeAll, afterEach, afterAll, describe, it, expect } from 'vitest';
import { setupServer } from 'msw/node';
import * as msw from 'msw';
import { vi } from 'vitest';
// use the http helper as 'rest' to create handlers (msw v2)
const rest = (msw as any).http;

// Mock the Echo client used by the hook so tests don't try to open websocket connections.
vi.mock('@/lib/echo', () => {
    return {
        default: {
            private: (_channel: string) => ({
                listen: (_event: string, _cb: any) => undefined,
                stopListening: (_event: string, _cb: any) => undefined,
            }),
        },
    };
});
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
        // console for debugging in CI/local runs
        // eslint-disable-next-line no-console
        console.log('msw: GET /api/v1/pipelines called');
        return res(
            ctx.status(200),
            ctx.json({
                stages: mockStages,
                leadsByStage: mockLeadsByStage,
            })
        );
    }),

    rest.post('/api/v1/pipelines/move', (_req, _res, _ctx) => {
        // Return a deterministic successful response
        return Response.json(
            { updated_lead: { id: 1, name: 'John Doe', pipeline_stage_key: 'contacted' } },
            { status: 200 }
        );
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
        const ref: any = React.createRef();

        // Provide initial data to avoid network timing flakiness in CI/local runs
        const Wrapper = React.forwardRef(function Wrapper(_props, ref) {
            const hook = usePipeline({ stages: mockStages, leadsByStage: mockLeadsByStage });
            React.useImperativeHandle(ref, () => hook, [hook]);
            return null;
        });

        render(<Wrapper ref={ref} />);

        expect(ref.current.loading).toBe(false);

        expect(ref.current.stages).toHaveLength(3);
        expect(ref.current.itemsByStage.new).toHaveLength(2);
    });

    it('handles API failure gracefully', async () => {
        server.use(
            rest.get('/api/v1/pipelines', (_req, res, ctx) => {
                return res(ctx.status(500), ctx.text('Server error'));
            })
        );

        const ref: any = React.createRef();
        const Wrapper = React.forwardRef(function Wrapper(_props, ref) {
            const hook = usePipeline();
            React.useImperativeHandle(ref, () => hook, [hook]);
            return null;
        });

        render(<Wrapper ref={ref} />);

        await waitFor(() => expect(ref.current.loading).toBe(false));
        expect(ref.current.error).toBeTruthy();
    });

    it('optimistically moves a lead to a new stage and confirms success', async () => {
        const ref: any = React.createRef();
        const Wrapper = React.forwardRef(function Wrapper(_props, ref) {
            const hook = usePipeline({ stages: mockStages, leadsByStage: mockLeadsByStage });
            React.useImperativeHandle(ref, () => hook, [hook]);
            return null;
        });

        render(<Wrapper ref={ref} />);

        // Initial: 2 leads in "new", 0 in "contacted"
        expect(ref.current.itemsByStage.new).toHaveLength(2);
        expect(ref.current.itemsByStage.contacted).toHaveLength(0);

        await act(async () => {
            await ref.current.moveLead({ leadId: 1, toStageKey: 'contacted' });
        });

        expect(ref.current.itemsByStage.new).toHaveLength(1);
        expect(ref.current.itemsByStage.contacted[0].pipeline_stage_key).toBe('contacted');
    });

    it('rolls back if API move fails', async () => {
        server.use(
            rest.post('/api/v1/pipelines/move', (_req, res, ctx) => res(ctx.status(500), ctx.text('Move failed')))
        );

        const ref: any = React.createRef();
        const Wrapper = React.forwardRef(function Wrapper(_props, ref) {
            const hook = usePipeline({ stages: mockStages, leadsByStage: mockLeadsByStage });
            React.useImperativeHandle(ref, () => hook, [hook]);
            return null;
        });

        render(<Wrapper ref={ref} />);

        await act(async () => {
            try {
                await ref.current.moveLead({ leadId: 1, toStageKey: 'qualified' });
            } catch {
                // Expected failure
            }
        });

        // After rollback, lead should remain in "new"
        expect(ref.current.itemsByStage.new.find((l) => l.id === 1)).toBeTruthy();
    });
});
