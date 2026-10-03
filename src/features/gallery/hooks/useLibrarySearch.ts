import { useMemo } from "react";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { imagesApi } from "../api/imagesApi";
import type { LibraryImage } from "../types";

export interface LibrarySearch {
  items: LibraryImage[];
  total: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function useLibrarySearch(query: string): LibrarySearch {
  const q = useSuspenseInfiniteQuery({
    queryKey: ["library", query],
    queryFn: ({ pageParam, signal }) => imagesApi.search(query, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage,
    staleTime: 60 * 60_000,
  });

  // The API occasionally repeats an item across pages; dedupe so React keys stay unique.
  const items = useMemo(() => {
    const seen = new Set<string>();
    return q.data.pages.flatMap((p) => p.items).filter((i) => !seen.has(i.id) && (seen.add(i.id), true));
  }, [q.data.pages]);

  return {
    items,
    total: q.data.pages[0]?.total ?? 0,
    hasNextPage: q.hasNextPage,
    isFetchingNextPage: q.isFetchingNextPage,
    fetchNextPage: () => void q.fetchNextPage(),
  };
}
