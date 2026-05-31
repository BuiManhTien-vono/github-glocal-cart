import apiClient from './apiClient';

export const extractItems = <T = any>(response: any): T[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.Items)) return response.Items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.Data)) return response.Data;
  return [];
};

export const fetchPagedItems = async <T = any>(path: string, pageSize = 50): Promise<T[]> => {
  let page = 1;
  let allItems: T[] = [];

  while (true) {
    const separator = path.includes('?') ? '&' : '?';
    const response: any = await apiClient.get(`${path}${separator}page=${page}&pageSize=${pageSize}`);
    allItems = allItems.concat(extractItems<T>(response));

    const totalPages = Number(response?.totalPages ?? response?.TotalPages ?? 0);
    const hasNext = response?.hasNext ?? response?.HasNext;

    if (totalPages > 0) {
      if (page >= totalPages) break;
    } else if (hasNext !== true) {
      break;
    }

    page += 1;
  }

  return allItems;
};
