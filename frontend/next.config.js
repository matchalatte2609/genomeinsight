/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove all API rewrites that were causing Docker networking issues
  // Frontend will connect directly to backend at localhost:8002
}

module.exports = nextConfig