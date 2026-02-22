"use client";

import { QRCodeSVG } from "qrcode.react";

export function QRCodeDownload() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white rounded-2xl p-4">
        <QRCodeSVG
          value="https://forkedapp.com/#download"
          size={160}
          bgColor="#ffffff"
          fgColor="#221610"
          level="M"
          imageSettings={{
            src: "/images/fork-logo/fork-gold.png",
            x: undefined,
            y: undefined,
            height: 32,
            width: 32,
            excavate: true,
          }}
        />
      </div>
      <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40">
        SCAN TO DOWNLOAD
      </p>
    </div>
  );
}
