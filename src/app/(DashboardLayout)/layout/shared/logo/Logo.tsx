'use client'
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Logo = () => {
  return (
   <Link href={'/dashboards'} className="inline-flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
        <Image
          src="/images/logos/ptwba.jpg"
          alt="PT. Wira Buana Arum"
          width={40}
          height={40}
          className="h-full w-full object-contain"
        />
      </div>
      <div>
        <div className="text-sm font-bold text-primary leading-none">HRIS</div>
        <div className="text-[11px] text-bodytext mt-1 leading-none">PT. Wira Buana Arum</div>
      </div>
    </Link>
  )
}

export default Logo
