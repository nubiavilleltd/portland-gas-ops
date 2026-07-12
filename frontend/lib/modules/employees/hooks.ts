import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { employeesApi } from "./api";
import type { CreateEmployeePayload, UpdateEmployeePayload, ListEmployeesParams } from "./types";

const KEYS = {
  all: ["employees"] as const,
  list: (params: ListEmployeesParams) => ["employees", "list", params] as const,
  detail: (id: string) => ["employees", "detail", id] as const,
  me: ["employees", "me"] as const,
  documents: (id: string) => ["employees", "documents", id] as const,
};

export function useEmployees(params: ListEmployeesParams = {}) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => employeesApi.list(params),
    enabled: isAuthenticated,
  });
}

export function useEmployee(id: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => employeesApi.get(id),
    enabled: isAuthenticated && !!id,
  });
}

export function useMyEmployee() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: KEYS.me,
    queryFn: () => employeesApi.getMe(),
    enabled: isAuthenticated,
    retry: false,
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
