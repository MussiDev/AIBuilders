/** @type {import('next').NextConfig} */
const nextConfig = {
  // El paquete compartido se distribuye como TS; Next lo transpila.
  transpilePackages: ['@app/shared'],
};

export default nextConfig;
