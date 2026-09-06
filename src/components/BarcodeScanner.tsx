import { useEffect, useRef, useState } from "react";
import { canScanCamera, lookupBarcode, type ProductLookup } from "../lib/openfoodfacts";
import { Sheet, SheetHeader } from "./ui";
import { SearchIcon } from "./icons";

// Minimal typing for the browser BarcodeDetector API (not in standard lib).
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: {
      new (opts?: { formats?: string[] }): BarcodeDetectorLike;
    };
  }
}

export function BarcodeScanner({
  open,
  onClose,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  onResult: (p: ProductLookup) => void;
}) {
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const cameraOK = canScanCamera();

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => {
    if (!open) {
      stopCamera();
      setManual("");
      setStatus(null);
    }
    return () => stopCamera();
  }, [open]);

  async function resolve(barcode: string) {
    stopCamera();
    setStatus("Looking up product…");
    const product = await lookupBarcode(barcode);
    if (!product.found) {
      setStatus(
        product.barcode
          ? "Not found in the database — enter the ingredients manually."
          : "Enter a valid barcode.",
      );
      // Still hand back the barcode so it's saved with the entry.
      if (product.barcode) onResult(product);
      return;
    }
    onResult(product);
  }

  async function startCamera() {
    if (!window.BarcodeDetector) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setScanning(true);
      setStatus("Point at a barcode…");
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      const detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });
      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const codes = await detector.detect(video);
          if (codes.length > 0) {
            await resolve(codes[0].rawValue);
            return;
          }
        } catch {
          /* keep trying */
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setStatus("Couldn't access the camera. Enter the barcode below.");
      setScanning(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Scan a barcode" onClose={onClose} />

      {cameraOK && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              background: "#000",
              aspectRatio: "4 / 3",
              display: scanning ? "block" : "none",
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: "28% 12%",
                border: "3px solid rgba(255,255,255,0.85)",
                borderRadius: 12,
              }}
            />
          </div>
          {!scanning && (
            <button className="btn" onClick={startCamera}>
              📷 Scan with camera
            </button>
          )}
          {scanning && (
            <button className="btn secondary" style={{ marginTop: 10 }} onClick={stopCamera}>
              Stop camera
            </button>
          )}
        </div>
      )}

      <div className="field">
        <label>{cameraOK ? "…or enter the barcode number" : "Enter the barcode number"}</label>
        <div
          className="input"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}
        >
          <input
            inputMode="numeric"
            placeholder="e.g. 3017620422003"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            style={{ border: "none", outline: "none", padding: "13px 0", flex: 1, background: "transparent" }}
          />
        </div>
      </div>

      <button
        className="btn"
        onClick={() => resolve(manual)}
        disabled={!manual.trim()}
      >
        <SearchIcon size={18} /> Look up product
      </button>

      {status && (
        <p className="tiny muted" style={{ textAlign: "center", marginTop: 12 }}>
          {status}
        </p>
      )}
      <p className="tiny muted" style={{ textAlign: "center", marginTop: 10 }}>
        Product data from Open Food Facts. Always double-check the label.
      </p>
    </Sheet>
  );
}
