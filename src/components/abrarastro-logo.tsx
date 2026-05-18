"use client";

import Link from "next/link";
import { useState } from "react";

type AbrarastroLogoProps = {
  height?: number;
  className?: string;
  href?: string;
  showTagline?: boolean;
  variant?: "default" | "onDark";
};

export function AbrarastroLogo({
  height = 48,
  className = "",
  href,
  showTagline = false,
  variant = "default",
}: AbrarastroLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const img = imgFailed ? (
    <span
      className="font-bold tracking-wide text-[#0f2744]"
      style={{ fontSize: height * 0.45, lineHeight: 1 }}
    >
      ABRARASTRO
    </span>
  ) : (
    <img
      src="/logos/abrarastro.png"
      alt="ABRARASTRO"
      height={height}
      className={`object-contain object-left ${className}`}
      style={{ height, width: "auto", maxWidth: height * 3.2 }}
      onError={() => setImgFailed(true)}
    />
  );

  const tagline = showTagline ? (
    <span
      className={`hidden max-w-[220px] text-xs leading-snug sm:block ${
        variant === "onDark" ? "text-slate-300" : "text-slate-500"
      }`}
    >
      Associação Brasileira de Rastreabilidade de Alimentos
    </span>
  ) : null;

  const content = (
    <div className="flex items-center gap-3">
      {img}
      {tagline}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {content}
      </Link>
    );
  }

  return content;
}
