import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

/**
 * Renders a QR code encoding the given text. Used on booklet pages to
 * encode a scannable reference for the member (registration number +
 * name) — there's no public verification page yet, so this is a plain
 * reference string rather than a URL; see docs/PASSES.md Pass 6 notes.
 */
export default function QrCode({ value, size = 90 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 1 }, () => {});
    }
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}
