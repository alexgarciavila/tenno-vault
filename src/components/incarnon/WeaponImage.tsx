"use client";

import Image from "next/image";
import { useState } from "react";
import type { IncarnonImage } from "../../data/catalog-schema";
import { IconTarget } from "../icons";

export function WeaponImage({ image }: { image: IncarnonImage | null }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(image ? "loading" : "error");
  const visible = image !== null && status !== "error";

  return (
    <div
      className="relative aspect-video w-full min-w-0 overflow-hidden rounded-lg border border-border bg-surface-alt p-3"
      data-image-state={image === null ? "missing" : status}
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex items-center justify-center text-fg-muted">
        <IconTarget className="h-8 w-8" />
      </div>
      {visible ? (
        <Image
          key={image.localPath}
          src={image.localPath}
          alt=""
          fill
          unoptimized
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1280px) 224px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className={`object-contain p-3 ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      ) : null}
    </div>
  );
}
