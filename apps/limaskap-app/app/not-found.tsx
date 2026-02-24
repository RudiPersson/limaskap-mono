'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { rootDomain, protocol } from '@/lib/utils';

export default function NotFound() {
  const pathname = usePathname();

  const subdomain = useMemo(() => {
    if (pathname?.startsWith('/s/')) {
      const extractedSubdomain = pathname.split('/')[2];
      return extractedSubdomain || null;
    }

    if (pathname?.startsWith('/subdomain/')) {
      const extractedSubdomain = pathname.split('/')[2];
      return extractedSubdomain || null;
    }

    return null;
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          {subdomain ? (
            <>
              <span className="text-blue-600">{subdomain}</span>.{rootDomain}{' '}
              doesn&apos;t exist
            </>
          ) : (
            'Subdomain Not Found'
          )}
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          This subdomain hasn&apos;t been created yet.
        </p>
        <div className="mt-6">
          <Link
            href={`${protocol}://${rootDomain}`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {subdomain ? `Create ${subdomain}` : `Go to ${rootDomain}`}
          </Link>
        </div>
      </div>
    </div>
  );
}
