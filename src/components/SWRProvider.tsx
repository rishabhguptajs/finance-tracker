"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
