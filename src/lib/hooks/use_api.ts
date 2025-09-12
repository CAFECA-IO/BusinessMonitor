import { useState, useEffect } from 'react';
import { ApiResponse } from '@/lib/response';
import { APIConfig, APIName } from '@/constants/api_connection';

function useApi<T>(api: APIName) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const apiConfig = APIConfig[api];

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(apiConfig.path, {
        method: apiConfig.method,
      });
      const result: ApiResponse<T> = await response.json();
      setData(result.payload);
      setSuccess(true);
    } catch (err) {
      setError(err as Error);
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { success, data, error, isLoading };
}

export default useApi;
