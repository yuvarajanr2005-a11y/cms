import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  Camera,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  MapPin
} from "lucide-react";

export const playScanSuccessChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch (_) {}
};

/**
 * Parses raw decoded QR string into structured complaint parameters
 */
export const parseQrPayload = (text) => {
  if (!text) return null;
  const raw = text.trim();

  // 1. Try URL parsing
  try {
    const urlObj = new URL(raw, window.location.origin);
    const params = urlObj.searchParams;
    const block = params.get("block");
    const floor = params.get("floor");
    const room = params.get("room");
    const category = params.get("category");
    const asset = params.get("asset");

    if (block || floor || room) {
      return {
        block: block || "",
        floor: floor || "",
        room: room || "",
        category: category || "",
        asset: asset || "",
        rawUrl: raw
      };
    }
  } catch (_) {}

  // 2. Try JSON payload
  try {
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.block || parsed.room || parsed.location)) {
      return {
        block: parsed.block || parsed.location?.block || "",
        floor: parsed.floor || parsed.location?.floor || "",
        room: parsed.room || parsed.location?.room || "",
        category: parsed.category || "",
        asset: parsed.asset || parsed.assetName || "",
        rawUrl: raw
      };
    }
  } catch (_) {}

  // 3. Fallback: comma or pipe delimited: "Block|Floor|Room|Category|Asset"
  if (raw.includes("|") || raw.includes(",")) {
    const parts = raw.split(/[|,]/).map((p) => p.trim());
    if (parts.length >= 2) {
      return {
        block: parts[0] || "",
        floor: parts[1] || "",
        room: parts[2] || "",
        category: parts[3] || "",
        asset: parts[4] || "",
        rawUrl: raw
      };
    }
  }

  return { rawText: raw };
};

export const QrScannerModal = ({ isOpen, onClose, onScannedLocation }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("camera"); // 'camera' | 'upload' | 'manual'
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [fileProcessing, setFileProcessing] = useState(false);

  const scannerRef = useRef(null);
  const containerId = "html5-qr-reader-modal";

  // Cleanup scanner instance
  const stopCameraScan = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("Scanner stop error:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanSuccess = (decodedText) => {
    playScanSuccessChime();
    const parsed = parseQrPayload(decodedText);
    setScanResult(parsed);
    stopCameraScan();

    if (onScannedLocation && parsed?.block) {
      onScannedLocation(parsed);
    }
  };

  const startCameraScan = async (cameraId) => {
    setCameraError("");
    setScanResult(null);

    try {
      await stopCameraScan();

      const html5Qr = new Html5Qrcode(containerId);
      scannerRef.current = html5Qr;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      const cameraConfig = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" };

      await html5Qr.start(
        cameraConfig,
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // ignore frame decode misses
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Camera scan start failed:", err);
      setCameraError(
        err?.name === "NotAllowedError" || err?.message?.includes("Permission")
          ? "Camera permission denied. Please allow camera access in browser settings, or use the 'Upload QR Image' tab."
          : "Unable to access camera. Please check your video device or use image upload."
      );
      setIsScanning(false);
    }
  };

  // Enumerate cameras when tab switches to camera
  useEffect(() => {
    if (!isOpen || activeTab !== "camera") {
      stopCameraScan();
      return;
    }

    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear")
          );
          const chosenId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(chosenId);
          startCameraScan(chosenId);
        } else {
          startCameraScan("");
        }
      })
      .catch(() => {
        if (isMounted) {
          startCameraScan("");
        }
      });

    return () => {
      isMounted = false;
      stopCameraScan();
    };
  }, [isOpen, activeTab]);

  // Handle image file scan
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileProcessing(true);
    setCameraError("");
    try {
      const html5Qr = new Html5Qrcode("qr-file-processor-temp");
      const decodedText = await html5Qr.scanFile(file, false);
      html5Qr.clear();
      handleScanSuccess(decodedText);
    } catch (err) {
      setCameraError("Could not detect a valid QR code in this image. Please try another clearer image.");
    } finally {
      setFileProcessing(false);
      e.target.value = "";
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanSuccess(manualInput.trim());
  };

  const handleProceedToComplaint = () => {
    if (!scanResult) return;
    onClose();

    const params = new URLSearchParams();
    if (scanResult.block) params.set("block", scanResult.block);
    if (scanResult.floor) params.set("floor", scanResult.floor);
    if (scanResult.room) params.set("room", scanResult.room);
    if (scanResult.category) params.set("category", scanResult.category);
    if (scanResult.asset) params.set("asset", scanResult.asset);
    params.set("qr", "true");

    navigate(`/student/new?${params.toString()}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <QrCode className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Smart Campus QR Scanner</h3>
              <p className="text-xs text-neutral-300">Scan room or asset tag to auto-fill location</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraScan();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden temp container for file scans */}
        <div id="qr-file-processor-temp" style={{ display: "none" }} />

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setScanResult(null);
              setActiveTab("camera");
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "camera"
                ? "border-black text-black"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Camera className="w-4 h-4" />
            Live Camera
          </button>

          <button
            type="button"
            onClick={() => {
              stopCameraScan();
              setScanResult(null);
              setActiveTab("upload");
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "upload"
                ? "border-black text-black"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload QR Image
          </button>

          <button
            type="button"
            onClick={() => {
              stopCameraScan();
              setScanResult(null);
              setActiveTab("manual");
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "manual"
                ? "border-black text-black"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Paste / Deep Link
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1">
          {scanResult ? (
            /* Result Banner */
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-900">QR Code Scanned Successfully!</h4>
                <p className="text-xs text-emerald-700 mt-1">SmartCMS verified room & facility data</p>
              </div>

              {scanResult.block ? (
                <div className="bg-white rounded-xl p-4 text-left border border-emerald-100 shadow-sm space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500 font-medium">Campus Block:</span>
                    <span className="font-bold text-neutral-900">{scanResult.block}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500 font-medium">Floor Level:</span>
                    <span className="font-bold text-neutral-900">{scanResult.floor || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500 font-medium">Room / Area:</span>
                    <span className="font-bold text-emerald-700">{scanResult.room || "N/A"}</span>
                  </div>
                  {scanResult.asset && (
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                      <span className="text-neutral-500 font-medium">Asset / Equipment:</span>
                      <span className="font-bold text-indigo-700">{scanResult.asset}</span>
                    </div>
                  )}
                  {scanResult.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 font-medium">Category:</span>
                      <span className="font-bold uppercase text-neutral-800">{scanResult.category}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-3 text-xs text-neutral-700 break-all text-left border border-neutral-200">
                  <span className="font-semibold block text-neutral-500 mb-1">Payload:</span>
                  {scanResult.rawText}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setScanResult(null);
                    if (activeTab === "camera") {
                      startCameraScan(selectedCameraId);
                    }
                  }}
                  className="flex-1 py-2.5 px-3 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition"
                >
                  Scan Again
                </button>
                <button
                  type="button"
                  onClick={handleProceedToComplaint}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Proceed to Form
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab 1: Live Camera */}
              {activeTab === "camera" && (
                <div className="space-y-4">
                  {cameraError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-700 min-h-[280px] flex items-center justify-center">
                    <div id={containerId} className="w-full h-full" />

                    {!isScanning && !cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 gap-2 bg-neutral-900">
                        <RefreshCw className="w-6 h-6 animate-spin text-neutral-300" />
                        <span className="text-xs">Initializing camera feed...</span>
                      </div>
                    )}
                  </div>

                  {cameras.length > 1 && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-neutral-600">Switch Camera:</label>
                      <select
                        value={selectedCameraId}
                        onChange={(e) => {
                          setSelectedCameraId(e.target.value);
                          startCameraScan(e.target.value);
                        }}
                        className="flex-1 text-xs border border-neutral-300 rounded-lg p-1.5 bg-white"
                      >
                        {cameras.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label || `Camera ${c.id.slice(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <p className="text-[11px] text-center text-neutral-500">
                    💡 Point your camera steadily at any SmartCMS room or asset QR placard
                  </p>
                </div>
              )}

              {/* Tab 2: Upload QR Image */}
              {activeTab === "upload" && (
                <div className="space-y-4 text-center">
                  <label className="border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition group">
                    <div className="w-12 h-12 rounded-full bg-neutral-200 group-hover:bg-neutral-300 flex items-center justify-center text-neutral-700 mb-3 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-neutral-800">
                      {fileProcessing ? "Scanning QR image..." : "Upload photo of QR code sticker"}
                    </span>
                    <span className="text-[11px] text-neutral-500 mt-1">
                      PNG, JPG, WEBP, Screenshot from mobile camera
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={fileProcessing}
                    />
                  </label>

                  {cameraError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-left flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Paste / Manual Link */}
              {activeTab === "manual" && (
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Paste Scanned QR String or Deep Link URL:
                    </label>
                    <textarea
                      rows={3}
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="e.g. http://localhost:5173/student/new?block=Hostel%20Block%20A%20(Boys)&floor=2nd%20Floor&room=Room%20202"
                      className="w-full p-2.5 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-black outline-none font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition"
                  >
                    Parse & Auto-Fill Location
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
