"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Label } from "@/components/ui";

type SignaturePadProps = {
  name?: string;
};

export function SignaturePad({ name = "assinaturaDataUrl" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [dataUrl, setDataUrl] = useState("");

  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/png");
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = 520;
    const h = 160;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    setDataUrl("");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 520;
    const h = 160;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0f2744";
    clearCanvas();
  }, [clearCanvas]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const finishStroke = () => {
    setDataUrl(exportCanvas());
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    drawing.current = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || mode !== "draw") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    finishStroke();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setDataUrl(url);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const img = new Image();
      img.onload = () => {
        const cw = 520;
        const ch = 160;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, cw, ch);
        const scale = Math.min(cw / img.width, ch / img.height) * 0.9;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
        setDataUrl(exportCanvas());
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("draw");
            setDataUrl("");
            clearCanvas();
          }}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            mode === "draw"
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Desenhar na tela
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("upload");
            setDataUrl("");
            clearCanvas();
          }}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            mode === "upload"
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Enviar imagem
        </button>
      </div>

      {mode === "draw" ? (
        <div>
          <Label>Assinatura (dedo ou mouse)</Label>
          <canvas
            ref={canvasRef}
            className="mt-2 w-full max-w-[520px] cursor-crosshair rounded-lg border border-slate-300 bg-white touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="secondary" onClick={clearCanvas}>
              Limpar assinatura
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Label>Arquivo da assinatura (PNG ou JPG)</Label>
          <input
            type="file"
            name="assinaturaArquivo"
            accept="image/png,image/jpeg,image/webp"
            className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200"
            onChange={onFileChange}
          />
        </div>
      )}

      {mode === "draw" && dataUrl && (
        <input type="hidden" name={name} value={dataUrl} />
      )}
      {mode === "upload" && dataUrl && (
        <input type="hidden" name={name} value={dataUrl} />
      )}
    </div>
  );
}
