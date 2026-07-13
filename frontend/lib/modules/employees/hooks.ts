import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "./api";
import type { CreateEmployeePayload, UpdateEmployeePayload, ListEmployeesParams } from "./types";
import { useAuthStore } from "@/store/authStore";

const KEYS = {
  all: ["employees"] as const,
  list: (params: ListEmployeesParams) => ["employees", "list", params] as const,
  detail: (id: string) => ["employees", "detail", id] as const,
  me: ["employees", "me"] as const,
  documents: (id: string) => ["employees", "documents", id] as const,
};

function shouldRetry(failureCount: number, error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 401 || status === 403 || status === 404 || status === 429) return false;
  return failureCount < 1;
}

export function useEmployees(params: ListEmployeesParams = {}) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => employeesApi.list(params),
    enabled: isAuthenticated,
    retry: shouldRetry,
  });
}

export function useEmployee(id: string) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => employeesApi.get(id),
    enabled: isAuthenticated && !!id,
    retry: shouldRetry,
  });
}

export function useMyEmployee() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: KEYS.me,
    queryFn: () => employeesApi.getMe(),
    enabled: isAuthenticated,
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
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: KEYS.documents(id),
    queryFn: () => employeesApi.getDocuments(id),
    enabled: isAuthenticated && !!id,
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
