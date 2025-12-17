import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
// Ensure matchMedia exists in the test environment (used by layout hooks)
if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }),
    });
}
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mocks for Inertia
const putMock = vi.fn();
const setDataMock = vi.fn((key: string, value: any) => {
    // update data store
    (mockForm.data as any)[key] = value;
});

const mockForm: any = {
    data: { title: 'Original title', description: 'Orig desc', type: 'conversation', document_id: null },
    setData: setDataMock,
    put: putMock,
    errors: {},
};

vi.mock('@inertiajs/react', () => ({
    useForm: () => mockForm,
    usePage: () => ({ url: '/', props: { lead: { id: 42, title: 'Original title', description: 'Orig desc', type: 'conversation' }, auth: { user: { id: 1, name: 'Tester', avatar: '' } } }, component: 'LeadEdit' }),
    Head: () => null,
    Link: (props: any) => (props.children ? props.children : null),
    router: { post: vi.fn(), put: vi.fn(), delete: vi.fn(), get: vi.fn(), visit: vi.fn() },
}));


import LeadEdit from '../edit';

describe('LeadEdit page', () => {
    beforeEach(() => {
        putMock.mockClear();
        setDataMock.mockClear();
        mockForm.data.title = 'Original title';
        mockForm.data.description = 'Orig desc';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders initial data and calls form.put on submit', () => {
        render(<LeadEdit />);

        // initial value
        const titleInput = screen.getByPlaceholderText('Lead Title') as HTMLInputElement;
        expect(titleInput).toBeDefined();
        expect(titleInput.value).toBe('Original title');

        // change title
        fireEvent.change(titleInput, { target: { value: 'New title' } });
        expect(setDataMock).toHaveBeenCalledWith('title', 'New title');

        // submit form
        const button = screen.getByRole('button', { name: /save changes/i });
        fireEvent.click(button);

        expect(putMock).toHaveBeenCalledWith('/leads/42');
    });
});
