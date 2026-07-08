import React from "react";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./css/globals.css";
import { Flowbite, ThemeModeScript } from "flowbite-react";
import customTheme from "@/utils/theme/custom-theme";
import { CustomizerContextProvider } from "@/app/context/CustomizerContext";
import "@/utils/i18n";
import "@/app/api/index";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "HRIS — PT. Wira Buana Arum",
  description: "Human Resource Information System — PT. Wira Buana Arum. Sistem penilaian kinerja karyawan yang terintegrasi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/images/logos/ptwba.jpg" type="image/jpeg" />
        <ThemeModeScript />
      </head>
      <body className={`${outfit.className}`}>
        <Flowbite theme={{ theme: customTheme }}>
          <CustomizerContextProvider>{children}</CustomizerContextProvider>
        </Flowbite>
      </body>
    </html>
  );
}
