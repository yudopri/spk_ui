'use client'
import React from 'react';
import Link from 'next/link';

const Logo = () => {
  return (
   <Link href={'/dashboards'} className="inline-flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg">
        W
      </div>
      <div>
        <div className="text-sm font-bold text-primary leading-none">HRIS</div>
        <div className="text-[11px] text-bodytext mt-1 leading-none">PT. Wira Buana Arum</div>
      </div>
    </Link>
  )
}

export default Logo
