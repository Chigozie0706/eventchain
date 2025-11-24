"use client";

import { useEffect, useState } from "react";
import blockies from "ethereum-blockies";

interface BlockieProps {
  address?: string;
  size?: number;
  scale?: number;
}

export default function Blockie({
  address,
  size = 8,
  scale = 4,
}: BlockieProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (address) {
      const canvas = blockies.create({
        seed: address.toLowerCase(),
        size: size,
        scale: scale,
      });

      setDataUrl(canvas.toDataURL());
    }
  }, [address, size, scale]);

  if (!dataUrl) {
    return <div className="w-5 h-5 rounded-md bg-gray-300"></div>;
  }

  return (
    <img src={dataUrl} className="w-5 h-5 rounded-md" alt="Blockie avatar" />
  );
}
