export type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}
