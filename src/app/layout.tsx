import React from "react";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./css/globals.css";
import { Flowbite } from "flowbite-react";
import customTheme from "@/utils/theme/custom-theme";
import { CustomizerContextProvider } from "@/app/context/CustomizerContext";
import GlobalDialog from "@/app/components/shared/GlobalDialog";
import "@/utils/i18n";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "HRIS — PT. Wira Buana Arum",
  description: "Human Resource Information System — PT. Wira Buana Arum. Sistem penilaian kinerja karyawan yang terintegrasi.",
  icons: { icon: "/images/logos/ptwba.jpg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var m=localStorage.getItem('app-theme-mode');if(m){document.documentElement.className=(document.documentElement.className?document.documentElement.className+' ':'')+m;}}catch(e){}",
          }}
        />
      </head>
      <body className={`${outfit.className}`}>
        <Flowbite theme={{ theme: customTheme }}>
          <CustomizerContextProvider>
            {children}
            <GlobalDialog />
          </CustomizerContextProvider>
        </Flowbite>
      </body>
    </html>
  );
}
