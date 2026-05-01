"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card, CardBody } from "@/components/ui/Card";

interface QRCodeDisplayProps {
  url: string;
  accessCode: string;
}

export function QRCodeDisplay({ url, accessCode }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 240,
      margin: 2,
      color: { dark: "#7C6EFF", light: "#111118" },
    })
      .then(() => setGenerated(true))
      .catch(console.error);
  }, [url]);

  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-3">
        <p className="text-sm font-semibold text-white">QR Code</p>
        <canvas
          ref={canvasRef}
          className="rounded-lg"
          aria-label={`QR code for ${url}`}
        />
        {generated && (
          <p className="text-xs text-text-secondary text-center">
            Scan to open the file page, then enter code:{" "}
            <code className="font-mono text-accent">{accessCode}</code>
          </p>
        )}
      </CardBody>
    </Card>
  );
}
