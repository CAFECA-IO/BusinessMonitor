import { useState, useEffect } from 'react';
import { ApiResponse } from '@/lib/response';
import { APIConfig } from '@/constants/api_connection';
import { IAPIName, IAPIInput, IAPIConfig } from '@/interfaces/api_connection';

function getAPIPath(apiConfig: IAPIConfig, input: IAPIInput) {
  const originalPath = apiConfig.path;

  // Info:(20250912 - Julian) Replace path parameters
  const path = originalPath.replace(/:([a-zA-Z_]+)/g, (_, key) => {
    const value = input.params?.[key] as string;
    return value;
  });

  // Info:(20250912 - Julian) Add query string
  const queryString = input?.query
    ? Object.keys(input.query)
        .filter((key) => input.query?.[key] !== undefined)
        .map(
          (key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(input.query?.[key]))}`
        )
        .join('&')
    : '';

  // Info:(20250912 - Julian) Combine path and query string
  const resultPath = queryString ? `${path}?${queryString}` : path;
  return resultPath;
}

function useApi<T>(apiNAme: IAPIName, options?: IAPIInput) {
  const [response, setResponse] = useState<ApiResponse<T> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const apiConfig = APIConfig[apiNAme];
  const apiPath = getAPIPath(apiConfig, options ?? {});

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(apiPath, { method: apiConfig.method });
      const result: ApiResponse<T> = await res.json();
      setResponse(result);
    } catch (err) {
      setError(err as Error);
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { ...response, error, isLoading };
}

export default useApi;
