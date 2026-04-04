/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/private/signature': ['./private/**'],
  },
};
module.exports = nextConfig;
