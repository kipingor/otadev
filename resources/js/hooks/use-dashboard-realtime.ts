import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Echo from 'laravel-echo';

declare global {
    interface Window {
        Echo: Echo;
    }
}

export function useDashboardRealtime() {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!window.Echo) {
            return;
        }

        // Listen for dashboard metric updates
        const channel = window.Echo.channel('dashboard-metrics');
        
        channel.listen('MetricsUpdated', (data: any) => {
            // Invalidate and refetch dashboard metrics
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        });

        // Listen for lead updates
        window.Echo.channel('leads')
            .listen('LeadCreated', () => {
                queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            })
            .listen('LeadUpdated', () => {
                queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            });

        // Listen for opportunity updates
        window.Echo.channel('opportunities')
            .listen('OpportunityCreated', () => {
                queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            })
            .listen('OpportunityUpdated', () => {
                queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            });

        // Listen for task updates
        window.Echo.channel('tasks')
            .listen('TaskUpdated', () => {
                queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            });

        // Cleanup function
        return () => {
            window.Echo.leaveChannel('dashboard-metrics');
            window.Echo.leaveChannel('leads');
            window.Echo.leaveChannel('opportunities');
            window.Echo.leaveChannel('tasks');
        };
    }, [queryClient]);
}
