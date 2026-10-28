import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IoT — Giám sát thông minh',
  description: 'Hệ thống giám sát cảm biến và điều khiển thiết bị IoT',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
