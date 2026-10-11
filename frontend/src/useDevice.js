import { useEffect, useState } from 'react';

// 'mobile' | 'tablet' | 'desktop' - from the browser's user-agent hints, falling back to viewport width.
export function detectDevice() {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  const u = navigator.userAgent || '';
  const phone = navigator.userAgentData ? navigator.userAgentData.mobile : /Android.+Mobile|iPhone|iPod|Windows Phone/i.test(u);
  const tablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(u) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (w < 700) return 'mobile';
  if (tablet) return 'tablet';
  if (phone) return 'mobile';
  if (w < 1100) return 'tablet';
  return 'desktop';
}

export function useDevice() {
  const [device, setDevice] = useState(detectDevice);
  useEffect(() => {
    let t;
    const on = () => { clearTimeout(t); t = setTimeout(() => setDevice(detectDevice()), 150); };
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => { clearTimeout(t); window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); };
  }, []);
  useEffect(() => { document.documentElement.dataset.device = device; }, [device]);
  return device;
}
