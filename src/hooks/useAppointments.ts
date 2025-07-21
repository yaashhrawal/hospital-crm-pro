import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../services/appointmentService';
import { queryKeys, createMutationOptions, useRealtimeSubscription } from '../config/reactQuery';
import type {
  AppointmentWithRelations,
  CreateAppointmentData,
  UpdateAppointmentData,
} from '../types/index';

interface AppointmentListParams {
  search?: string;
  doctor?: string;
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}

// Query hooks
export const useAppointments = (params: AppointmentListParams = {}) => {
  return useQuery({
    queryKey: queryKeys.appointments(params),
    queryFn: () => appointmentService.getAppointments(params),
    // keepPreviousData: true, // Deprecated in React Query v5
  });
};

export const useAppointment = (id: string) => {
  return useQuery({
    queryKey: queryKeys.appointment(id),
    queryFn: () => appointmentService.getAppointmentById(id),
    enabled: !!id,
  });
};

export const useTodayAppointments = () => {
  return useQuery({
    queryKey: queryKeys.todayAppointments,
    queryFn: () => appointmentService.getTodayAppointments(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useDoctorUpcomingAppointments = (doctorId: string, limit?: number) => {
  return useQuery({
    queryKey: queryKeys.doctorAppointments(doctorId),
    queryFn: () => appointmentService.getDoctorUpcomingAppointments(doctorId, limit),
    enabled: !!doctorId,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};

export const useAppointmentStats = () => {
  return useQuery({
    queryKey: queryKeys.appointmentStats,
    queryFn: () => appointmentService.getAppointmentStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation hooks
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    createMutationOptions(
      (data: CreateAppointmentData) => appointmentService.createAppointment(data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.appointments() });
          queryClient.invalidateQueries(queryKeys.todayAppointments);
          queryClient.invalidateQueries(queryKeys.appointmentStats);
        },
        optimisticUpdate: {
          queryKey: queryKeys.appointments(),
          updater: (oldData: any, variables) => {
            if (!oldData) return oldData;
            
            const newAppointment: AppointmentWithRelations = {
              id: `temp-${Date.now()}`,
              appointment_id: `APT${Date.now()}`,
              ...variables,
              duration: variables.duration || 30,
              appointment_type: variables.appointment_type || 'CONSULTATION',
              status: 'SCHEDULED',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            return {
              ...oldData,
              data: [newAppointment, ...oldData.data],
              count: oldData.count + 1,
            };
          },
        },
      }
    )
  );
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    createMutationOptions(
      ({ id, updates }: { id: string; updates: UpdateAppointmentData }) =>
        appointmentService.updateAppointment(id, updates),
      {
        onSuccess: (data, variables) => {
          // Update the specific appointment cache
          queryClient.setQueryData(queryKeys.appointment(variables.id), data);
          
          // Invalidate appointment lists
          queryClient.invalidateQueries({ queryKey: queryKeys.appointments() });
          queryClient.invalidateQueries(queryKeys.todayAppointments);
          queryClient.invalidateQueries(queryKeys.appointmentStats);
        },
        optimisticUpdate: {
          queryKey: queryKeys.appointment(''),
          updater: (oldData: any, variables) => {
            if (!oldData || oldData.id !== variables.id) return oldData;
            return { ...oldData, ...variables.updates };
          },
        },
      }
    )
  );
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    createMutationOptions(
      ({ id, reason }: { id: string; reason?: string }) =>
        appointmentService.cancelAppointment(id, reason),
      {
        onSuccess: (_, variables) => {
          // Update appointment status optimistically
          queryClient.setQueryData(queryKeys.appointment(variables.id), (oldData: any) => {
            if (!oldData) return oldData;
            return { ...oldData, status: 'CANCELLED' };
          });
          
          queryClient.invalidateQueries({ queryKey: queryKeys.appointments() });
          queryClient.invalidateQueries(queryKeys.todayAppointments);
          queryClient.invalidateQueries(queryKeys.appointmentStats);
        },
        optimisticUpdate: {
          queryKey: queryKeys.appointment(''),
          updater: (oldData: any, variables) => {
            if (!oldData || oldData.id !== variables.id) return oldData;
            return { ...oldData, status: 'CANCELLED' };
          },
        },
      }
    )
  );
};

// Real-time subscription hook
export const useAppointmentsRealtime = (enabled: boolean = true) => {
  useRealtimeSubscription(
    (callback) => appointmentService.subscribeToAppointments(callback),
    [
      queryKeys.appointments(),
      queryKeys.todayAppointments,
      queryKeys.appointmentStats,
    ],
    enabled
  );
};

// Helper hooks
export const useAppointmentsByStatus = (status: string) => {
  return useAppointments({
    filters: {
      status: status as any,
    },
  });
};

export const useAppointmentsByPatient = (patientId: string) => {
  return useAppointments({
    filters: {
      patientId,
    },
    sortBy: 'scheduled_at',
    sortOrder: 'desc',
  });
};

export const useAppointmentsByDoctor = (doctorId: string) => {
  return useAppointments({
    filters: {
      doctorId,
    },
    sortBy: 'scheduled_at',
    sortOrder: 'asc',
  });
};

export const useAppointmentsByDateRange = (startDate: string, endDate: string) => {
  return useAppointments({
    filters: {
      dateRange: {
        start: startDate,
        end: endDate,
      },
    },
    sortBy: 'scheduled_at',
    sortOrder: 'asc',
  });
};

export const useUpcomingAppointments = (limit: number = 10) => {
  const today = new Date().toISOString();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  return useAppointments({
    filters: {
      dateRange: {
        start: today,
        end: nextWeek,
      },
      status: 'SCHEDULED',
    },
    limit,
    sortBy: 'scheduled_at',
    sortOrder: 'asc',
  });
};

// Appointment time slot helpers
export const useAvailableTimeSlots = (doctorId: string, date: string) => {
  const { data: existingAppointments } = useAppointments({
    filters: {
      doctorId,
      dateRange: {
        start: `${date}T00:00:00Z`,
        end: `${date}T23:59:59Z`,
      },
    },
  });

  return React.useMemo(() => {
    // Generate time slots (9 AM to 6 PM, 30-minute intervals)
    const slots: string[] = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Filter out booked slots
    const bookedSlots = existingAppointments?.data
      ?.filter(apt => apt.status !== 'CANCELLED')
      ?.map(apt => {
        const scheduledTime = new Date(apt.scheduled_at);
        return `${scheduledTime.getHours().toString().padStart(2, '0')}:${scheduledTime.getMinutes().toString().padStart(2, '0')}`;
      }) || [];

    return slots.filter(slot => !bookedSlots.includes(slot));
  }, [existingAppointments]);
};

// Export types for convenience
export type { 
  AppointmentWithRelations, 
  CreateAppointmentData, 
  AppointmentListParams,
  UpdateAppointmentData 
};