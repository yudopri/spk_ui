/** @type {import('next').NextConfig} */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig = {
    reactStrictMode: false,
    ...(isProduction ? { output: 'export' } : {}),
    images: {
        unoptimized: true,
    },
};

export default nextConfig;

