import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export interface QrCodeProps {
  readonly value: string;
  readonly size?: number;
}

/** Client-side generated QR Code SVG (F11 R-1). */
export function QrCode({ value, size = 36 }: QrCodeProps) {
  const [svgString, setSvgString] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;
    QRCode.toString(value, { type: 'svg', margin: 0, width: size }, (err, svg) => {
      if (!isCancelled && !err && svg) {
        setSvgString(svg);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [value, size]);

  if (!svgString) {
    return <div style={{ width: size, height: size, backgroundColor: '#fff' }} />;
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
