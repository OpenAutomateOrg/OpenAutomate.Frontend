'use client'

import { useMemo, useEffect } from 'react'
import useSWR from 'swr'
import { useToast } from '@/components/ui/use-toast'
import { swrKeys } from '@/lib/config/swr-config'
import {
    getScheduleById,
    enableSchedule,
    disableSchedule,
    deleteSchedule,
    getAllSchedules,
    type ScheduleResponseDto
} from '@/lib/api/schedules'
import { getBotAgentById } from '@/lib/api/bot-agents'

/**
 * Hook for fetching bot agent by ID
 */
export function useBotAgent(agentId: string | null) {
    const { data: agent, error, isLoading, mutate } = useSWR(
        agentId ? swrKeys.agentById(agentId) : null,
        agentId ? () => getBotAgentById(agentId) : null
    )

    return {
        agent,
        isLoading,
        error,
        mutate,
    }
}

/**
 * Hook for fetching a single schedule by ID
 */
export function useSchedule(id: string) {
    const { toast } = useToast()

    const { data: schedule, error, isLoading, mutate } = useSWR(
        swrKeys.scheduleById(id),
        () => getScheduleById(id)
    )

    // ✅ Error handling in dedicated effect
    useEffect(() => {
        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to load schedule details',
                variant: 'destructive',
            })
        }
    }, [error, toast])

    // ✅ Event handlers for schedule actions
    const toggleStatus = async () => {
        if (!schedule) return

        try {
            if (schedule.isEnabled) {
                await disableSchedule(id)
            } else {
                await enableSchedule(id)
            }

            toast({
                title: 'Success',
                description: `Schedule ${schedule.isEnabled ? 'disabled' : 'enabled'} successfully`,
            })
            mutate() // ✅ Refresh cache
        } catch (error) {
            console.error('Failed to toggle schedule status:', error)
            toast({
                title: 'Error',
                description: 'Failed to update schedule status',
                variant: 'destructive',
            })
        }
    }

    // ✅ Delete schedule function
    const deleteScheduleAction = async () => {
        if (!schedule) return

        try {
            await deleteSchedule(id)
            toast({
                title: 'Success',
                description: 'Schedule deleted successfully',
            })
            // Don't need to mutate since component will redirect
        } catch (error) {
            console.error('Failed to delete schedule:', error)
            toast({
                title: 'Error',
                description: 'Failed to delete schedule',
                variant: 'destructive',
            })
        }
    }

    return {
        schedule,
        isLoading,
        error,
        mutate,
        toggleStatus,
        deleteScheduleAction,
    }
}

/**
 * Hook for fetching all schedules
 */
export function useSchedules() {
    const { toast } = useToast()

    const { data: schedules, error, isLoading, mutate } = useSWR(
        swrKeys.schedules(),
        getAllSchedules
    )

    // ✅ Error handling in dedicated effect
    useEffect(() => {
        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to load schedules',
                variant: 'destructive',
            })
        }
    }, [error, toast])

    // ✅ Derive filtered data during render
    const activeSchedules = useMemo(() =>
        schedules?.filter(schedule => schedule.isEnabled) ?? [],
        [schedules]
    )

    const inactiveSchedules = useMemo(() =>
        schedules?.filter(schedule => !schedule.isEnabled) ?? [],
        [schedules]
    )

    return {
        schedules,
        activeSchedules,
        inactiveSchedules,
        isLoading,
        error,
        mutate,
    }
}

/**
 * Helper hook for schedule data formatting
 */
export function useScheduleFormatting(schedule: ScheduleResponseDto | null) {
    return useMemo(() => {
        if (!schedule) return null

        return {
            createdDate: new Date(schedule.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
            updatedDate: new Date(schedule.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
            nextRunDate: schedule.nextRunTime
                ? new Date(schedule.nextRunTime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })
                : null,
            oneTimeDate: schedule.oneTimeExecution
                ? new Date(schedule.oneTimeExecution).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })
                : null,
        }
    }, [schedule])
}
