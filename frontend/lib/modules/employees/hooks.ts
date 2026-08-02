import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "./api";
import type { CreateEmployeePayload, UpdateEmployeePayload, ListEmployeesParams, UpdateOwnProfilePayload } from "./types";
import { useAuthStore } from "@/store/authStore";

const KEYS = {
  all: ["employees"] as const,
  list: (params: ListEmployeesParams) => ["employees", "list", params] as const,
  directory: (search: string) => ["employees", "directory", search] as const,
  detail: (id: string) => ["employees", "detail", id] as const,
  me: ["employees", "me"] as const,
  documents: (id: string) => ["employees", "documents", id] as const,
  weekBirthdays: ["employees", "birthdays", "week"] as const,
};

function shouldRetry(failureCount: number, error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 401 || status === 403 || status === 404 || status === 429) return false;
  return failureCount < 1;
}

export function useEmployees(params: ListEmployeesParams = {}) {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => employeesApi.list(params),
    enabled: Boolean(accessToken),
    retry: shouldRetry,
  });
}

/** Payroll-free employee directory — open to any authenticated user. Use this
 *  (not useEmployees) wherever a non-admin needs to pick a colleague. */
export function useEmployeeDirectory(search = "") {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: KEYS.directory(search),
    queryFn: () => employeesApi.directory(search),
    enabled: Boolean(accessToken),
    retry: shouldRetry,
  });
}

export function useEmployee(id: string) {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => employeesApi.get(id),
    enabled: Boolean(accessToken) && !!id,
    retry: shouldRetry,
  });
}

export function useMyEmployee() {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: KEYS.me,
    queryFn: () => employeesApi.getMe(),
    enabled: Boolean(accessToken),
    retry: shouldRetry,
  });
}

export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateEmployeePayload) => employeesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => employeesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useChangeEmployeeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => employeesApi.changeRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOwnProfilePayload) => employeesApi.updateMyProfile(payload),
    onSuccess: (updated) => {
      // The PATCH returns the saved record — seed the cache with it so the form
      // repaints instantly. Invalidating alone leaves the stale value on screen
      // for the length of the refetch.
      qc.setQueryData(KEYS.me, updated);
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUploadProfilePicture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => employeesApi.uploadPicture(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.me });
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["current-user"] }); // refresh sidebar/navbar avatar
    },
  });
}

export function useDeactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useReactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.reactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useResendSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.resendSetup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useEmployeeDocuments(id: string) {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: KEYS.documents(id),
    queryFn: () => employeesApi.getDocuments(id),
    enabled: Boolean(accessToken) && !!id,
    retry: shouldRetry,
  });
}

export function useUploadEmployeeDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, docType }: { file: File; docType: string }) =>
      employeesApi.uploadDocument(id, file, docType),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.documents(id) }),
  });
}

export function useDeleteEmployeeDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: number) => employeesApi.deleteDocument(id, docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.documents(id) }),
  });
}

/** Employees with birthdays today through the next 6 days — for the intranet home page */
export function useWeekBirthdays() {
  return useQuery({
    queryKey: KEYS.weekBirthdays,
    queryFn: () => employeesApi.getWeekBirthdays(),
    staleTime: 60 * 60 * 1000, // 1 hour — birthdays don't change mid-day
  });
}
