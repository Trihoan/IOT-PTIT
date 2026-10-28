import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

export default function config(phase) {
  const apiUrl = (process.env.API_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
    async rewrites() {
      return [{ source: '/api/:path*', destination: apiUrl + '/api/:path*' }];
    },
  };
}
