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
  const [src, setSrc] = useState("/logos/abrarastro.png");

  const img = (
    <img
      src={src}
      alt="ABRARASTRO"
      height={height}
      className={`object-contain object-left ${className}`}
      style={{ height, width: "auto", maxWidth: height * 3.2 }}
      onError={() => {
        if (src !== "/api/logo/abrarastro") {
          setSrc("/api/logo/abrarastro");
        }
      }}
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
