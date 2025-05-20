import type { NextPage } from 'next';

declare module 'next' {
  export type NextPageWithSearchParams<P = Record<string, unknown>, IP = P> = NextPage<P, IP> & {
    searchParams?: { [key: string]: string | string[] | undefined };
  };
} 