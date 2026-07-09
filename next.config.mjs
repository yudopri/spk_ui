/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === "production";

const nextConfig = {
    reactStrictMode: true,
    images: {
        unoptimized: true,
    },
};

export default nextConfig;

