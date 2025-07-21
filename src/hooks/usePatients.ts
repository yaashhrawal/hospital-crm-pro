import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import { queryKeys, createMutationOptions, useRealtimeSubscription } from '../config/reactQuery';
import type { PatientWithRelations, PatientListParams } from '../types/index';

interface CreatePatientData {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  date_of_birth: string;
  gender: string;
  address: string;
  [key: string]: any;
}

// Query hooks
export const usePatients = (params: PatientListParams = {}) => {
  return useQuery({
    queryKey: queryKeys.patients(params),
    queryFn: () => patientService.getPatients(params),
    // keepPreviousData: true, // Deprecated in React Query v5
  });
};

export const usePatient = (id: string) => {
  return useQuery({
    queryKey: queryKeys.patient(id),
    queryFn: () => patientService.getPatientById(id),
    enabled: !!id,
  });
};

export const usePatientByPhone = (phone: string) => {
  return useQuery({
    queryKey: queryKeys.patientByPhone(phone),
    queryFn: () => patientService.getPatientByPhone(phone),
    enabled: !!phone && phone.length >= 10,
  });
};

export const usePatientStats = () => {
  return useQuery({
    queryKey: queryKeys.patientStats,
    queryFn: () => patientService.getPatientStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation hooks
export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    createMutationOptions(
      ({ data, createdBy }: { data: CreatePatientData; createdBy: string }) =>
        patientService.createPatient(data, createdBy),
      {
        onSuccess: () => {
          // Invalidate patient lists and stats
          queryClient.invalidateQueries(queryKeys.patients());
          queryClient.invalidateQueries(queryKeys.patientStats);
        },
        optimisticUpdate: {
          queryKey: queryKeys.patients(),
          updater: (oldData: any, variables) => {
            if (!oldData) return oldData;
            
            const newPatient: PatientWithRelations = {
              id: `temp-${Date.now()}`,
              patient_id: `PAT${Date.now()}`,
              ...variables.data,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              created_by: variables.createdBy,
            };

            return {
              ...oldData,
              data: [newPatient, ...oldData.data],
              count: oldData.count + 1,
            };
          },
        },
      }
    )
  );
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    createMutationOptions(
      ({ id, updates }: { id: string; updates: Partial<CreatePatientData> }) =>
        patientService.updatePatient(id, updates),
      {
        onSuccess: (data, variables) => {
          // Update the specific patient cache
          queryClient.setQueryData(queryKeys.patient(variables.id), data);
          
          // Invalidate patient lists
          queryClient.invalidateQueries(queryKeys.patients());
        },
        optimisticUpdate: {
          queryKey: queryKeys.patient(''),
          updater: (oldData: any, variables) => {
            if (!oldData || oldData.id !== variables.id) return oldData;
            return { ...oldData, ...variables.updates };
          },
        },
      }
    )
  );
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    createMutationOptions(
      (id: string) => patientService.deletePatient(id),
      {
        onSuccess: (_, id) => {
          // Remove from patient lists
          queryClient.setQueriesData(
            queryKeys.patients(),
            (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                data: oldData.data.filter((patient: any) => patient.id !== id),
                count: oldData.count - 1,
              };
            }
          );
          
          // Invalidate stats
          queryClient.invalidateQueries(queryKeys.patientStats);
        },
        optimisticUpdate: {
          queryKey: queryKeys.patients(),
          updater: (oldData: any, id) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: oldData.data.filter((patient: any) => patient.id !== id),
              count: oldData.count - 1,
            };
          },
        },
      }
    )
  );
};

export const useRestorePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    createMutationOptions(
      (id: string) => patientService.restorePatient(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(queryKeys.patients());
          queryClient.invalidateQueries(queryKeys.patientStats);
        },
      }
    )
  );
};

export const useBulkImportPatients = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    createMutationOptions(
      ({ patients, createdBy }: { patients: CreatePatientData[]; createdBy: string }) =>
        patientService.bulkImportPatients(patients, createdBy),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(queryKeys.patients());
          queryClient.invalidateQueries(queryKeys.patientStats);
        },
      }
    )
  );
};

// Real-time subscription hook
export const usePatientsRealtime = (enabled: boolean = true) => {
  useRealtimeSubscription(
    (callback) => patientService.subscribeToPatients(callback),
    [
      queryKeys.patients(),
      queryKeys.patientStats,
    ],
    enabled
  );
};

// Helper hooks
export const usePatientSearch = (searchTerm: string, debounceMs: number = 300) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm, debounceMs]);

  return usePatients({
    filters: {
      search: debouncedSearchTerm,
    },
  });
};

export const usePatientsByGender = (gender?: 'MALE' | 'FEMALE' | 'OTHER') => {
  return usePatients({
    filters: {
      gender,
    },
  });
};

export const useRecentPatients = (limit: number = 10) => {
  return usePatients({
    limit,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
};

// Export types for convenience
export type { PatientWithRelations, CreatePatientData, PatientListParams };