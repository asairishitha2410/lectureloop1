/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/", permanent: false },
      { source: "/generate", destination: "/lectures/new", permanent: false },
      { source: "/revision", destination: "/flashcards", permanent: false },
    ];
  },
};

export default nextConfig;