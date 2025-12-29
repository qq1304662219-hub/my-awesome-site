/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'kzmeigukkqaqflscdcnl.supabase.co', // Allow Supabase Storage
                port: '',
                pathname: '/**',
            }
        ],
    },
};

export default nextConfig;
