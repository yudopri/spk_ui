/**
 * Ambil pesan error dari API secara konsisten.
 * Interceptor axios me-reject dengan object { status, message, data } (bukan axios error),
 * jadi err?.response?.data?.message sering undefined. Helper ini menangani keduanya.
 */
export const getApiErrorMessage = (err: any, fallback = "Terjadi kesalahan"): string => {
  if (!err) return fallback;
  return (
    err?.response?.data?.message ||
    err?.data?.message ||
    err?.message ||
    (typeof err === "string" ? err : null) ||
    fallback
  );
};

export const getApiErrorStatus = (err: any): number | undefined => {
  return err?.response?.status ?? err?.status;
};
