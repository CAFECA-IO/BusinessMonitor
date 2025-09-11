import { useState, useEffect } from 'react';
import { ApiResponse } from '@/lib/response';

function useApi<T>(api: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(api)
      .then((res) => res.json())
      .then((d: ApiResponse<T>) => {
        if (isMounted) {
          const { payload } = d; // Info: (20250911 - Julian) 解構 response 取得 payload
          setData(payload);
          setSuccess(true);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setSuccess(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [api]);

  return { success, data, error, isLoading };
}

export default useApi;
