"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

export interface SignaturePadHandle {
  getBlob(): Promise<Blob | null>;
  isEmpty(): boolean;
  clear(): void;
}

// Plain-canvas signature capture: pointer events cover finger, glove-friendly
// styluses and mouse. Exported as PNG.
export default function SignaturePad({
  handleRef,
}: {
  handleRef: Ref<SignaturePadHandle>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0b2545";
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // A dot for taps, so even the shortest touch leaves ink
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    setHasInk(true);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  useImperativeHandle(handleRef, () => ({
    async getBlob() {
      const canvas = canvasRef.current;
      if (!canvas || !hasInk) return null;
      return new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
    },
    isEmpty() {
      return !hasInk;
    },
    clear() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasInk(false);
    },
  }));

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="h-48 w-full touch-none rounded-xl border-2 border-dashed border-navy/30 bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-sm text-navy/50">
          {hasInk ? "" : "Sign in the box above"}
        </p>
        <button
          type="button"
          onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasInk(false);
          }}
          className="min-h-[44px] rounded-xl px-4 text-sm font-semibold text-navy/60 active:bg-gray-100"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
