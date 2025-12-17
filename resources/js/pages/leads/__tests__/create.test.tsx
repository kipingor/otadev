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

const postMock = vi.fn();
const setDataMock = vi.fn((key: string, value: any) => {
    (mockForm.data as any)[key] = value;
});

const mockForm: any = {
    data: { title: '', description: '', type: 'conversation', document_id: null },
    setData: setDataMock,
    post: postMock,
    errors: {},
};

vi.mock('@inertiajs/react', () => ({
    useForm: () => mockForm,
    usePage: () => ({ url: '/', props: (global as any).__TEST_PAGE_PROPS || { auth: { user: { id: 1, name: 'Test User', avatar: '' } } }, component: 'Test' }),
    Head: () => null,
    Link: (props: any) => (props.children ? props.children : null),
    router: { post: vi.fn(), put: vi.fn(), delete: vi.fn(), get: vi.fn(), visit: vi.fn() },
}));


import LeadCreate from '../create';

describe('LeadCreate page', () => {
    beforeEach(() => {
        postMock.mockClear();
        setDataMock.mockClear();
        mockForm.data.title = '';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders and calls form.post on submit', () => {
        render(<LeadCreate />);

        const titleInput = screen.getByPlaceholderText('Lead Title') as HTMLInputElement;
        expect(titleInput).toBeDefined();

        fireEvent.change(titleInput, { target: { value: 'Brand new' } });
        expect(setDataMock).toHaveBeenCalledWith('title', 'Brand new');

        const button = screen.getByRole('button', { name: /create lead/i });
        fireEvent.click(button);

        expect(postMock).toHaveBeenCalledWith('/leads');
    });
});
