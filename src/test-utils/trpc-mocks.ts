import { vi } from "vitest";

export const createMockTRPCMutation = (onSuccess?: (data: unknown) => void) => {
  const mutate = vi.fn(
    (data, options?: { onSuccess?: (data: unknown) => void }) => {
      if (options?.onSuccess && onSuccess) {
        options.onSuccess(onSuccess(data));
      }
    },
  );

  return {
    mutate,
    mutateAsync: vi.fn(),
    isPending: false,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
  };
};

export const createMockTRPCQuery = (data: unknown) => {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    isSuccess: true,
  };
};

export const mockTRPCUtils = () => ({
  invalidate: vi.fn(),
  invalidateQueries: vi.fn(),
  refetch: vi.fn(),
  setData: vi.fn(),
  getData: vi.fn(),
});
