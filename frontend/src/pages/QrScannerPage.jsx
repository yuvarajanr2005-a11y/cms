import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  MapPin,
  Building,
  Layers,
  DoorClosed,
  ArrowRight,
  Zap,
  Info
} from "lucide-react";
import { playScanSuccessChime, parseQrPayload } from "../components/QrScannerModal";

export const QrScannerPage = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState("camera"); // 'camera' | 'upload'
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [fileProcessing, setFileProcessing] = useState(false);

  const scannerRef = useRef(null);
  const containerId = "html5-qr-reader-page";

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("Stop scanner warning:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanSuccess = (decodedText) => {
    playScanSuccessChime();
    const parsed = parseQrPayload(decodedText);
    setScanResult(parsed);
    stopScanner();
  };

  const startScanner = async (cameraId) => {
    setCameraError("");
    setScanResult(null);

    try {
      await stopScanner();
      const html5Qr = new Html5Qrcode(containerId);
      scannerRef.current = html5Qr;

      const config = {
        fps: 15,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0
      };

      const cameraConfig = cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode: "environment" };

      await html5Qr.start(
        cameraConfig,
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Camera start failed:", err);
      setCameraError(
        err?.name === "NotAllowedError" || err?.message?.includes("Permission")
          ? "Camera permission denied. Please allow camera permissions in your browser or upload a photo of the QR code sticker."
          : "Could not open camera stream. Please ensure your camera is not in use by another app or use image upload."
      );
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (activeMode !== "camera") {
      stopScanner();
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
          startScanner(chosenId);
        } else {
          startScanner("");
        }
      })
      .catch(() => {
        if (isMounted) startScanner("");
      });

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [activeMode]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileProcessing(true);
    setCameraError("");
    try {
      const html5Qr = new Html5Qrcode("page-temp-file-processor");
      const decodedText = await html5Qr.scanFile(file, false);
      html5Qr.clear();
      handleScanSuccess(decodedText);
    } catch (err) {
      setCameraError("No readable QR code found in uploaded image. Please ensure good lighting and contrast.");
    } finally {
      setFileProcessing(false);
      e.target.value = "";
    }
  };

  const handleProceedToForm = () => {
    if (!scanResult) return;
    const params = new URLSearchParams();
    if (scanResult.block) params.set("block", scanResult.block);
    if (scanResult.floor) params.set("floor", scanResult.floor);
    if (scanResult.room) params.set("room", scanResult.room);
    if (scanResult.category) params.set("category", scanResult.category);
    if (scanResult.asset) params.set("asset", scanResult.asset);
    params.set("qr", "true");

    navigate(`/student/new?${params.toString()}`);
  };

  const applyDemoPreset = (preset) => {
    handleScanSuccess(
      `${window.location.origin}/student/new?block=${encodeURIComponent(
        preset.block
      )}&floor=${encodeURIComponent(preset.floor)}&room=${encodeURIComponent(
        preset.room
      )}&category=${preset.category}&asset=${encodeURIComponent(preset.asset)}&qr=true`
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden processor element */}
      <div id="page-temp-file-processor" style={{ display: "none" }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-400/30">
            <QrCode className="w-3.5 h-3.5" />
            Smart Campus IoT Scanner
          </div>
          <h1 className="text-2xl font-black tracking-tight">Scan Room or Facility QR Code</h1>
          <p className="text-xs text-neutral-300 mt-1 max-w-xl">
            Point your camera at any campus door tag, lab workstation, or hostel room placard. SmartCMS will automatically populate your grievance form with exact block, floor, and room coordinates.
          </p>
        </div>

        <button
          onClick={() => navigate("/qr-generator")}
          className="self-start sm:self-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-2 text-white"
        >
          <QrCode className="w-4 h-4 text-amber-300" />
          <span>QR Generator Suite</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Scanner Viewport */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setScanResult(null);
                  setActiveMode("camera");
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeMode === "camera"
                    ? "bg-black text-white shadow-sm"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Live Camera
              </button>

              <button
                onClick={() => {
                  stopScanner();
                  setScanResult(null);
                  setActiveMode("upload");
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeMode === "upload"
                    ? "bg-black text-white shadow-sm"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Photo
              </button>
            </div>

            {activeMode === "camera" && cameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  startScanner(e.target.value);
                }}
                className="text-xs border border-neutral-200 rounded-lg p-1.5 bg-neutral-50 text-neutral-800"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Scanner or Scanned Result */}
          {scanResult ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-900">QR Code Verified & Decoded</h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Location data parsed successfully. Click below to file your complaint.
                </p>
              </div>

              {scanResult.block && (
                <div className="bg-white rounded-2xl p-4 text-left border border-emerald-200 shadow-sm space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-neutral-400" />
                      Block / Hostel:
                    </span>
                    <span className="font-bold text-neutral-900">{scanResult.block}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-neutral-400" />
                      Floor Level:
                    </span>
                    <span className="font-bold text-neutral-900">{scanResult.floor || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                      <DoorClosed className="w-3.5 h-3.5 text-emerald-600" />
                      Room / Area:
                    </span>
                    <span className="font-bold text-emerald-700">{scanResult.room || "N/A"}</span>
                  </div>
                  {scanResult.asset && (
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                      <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Asset Tag:
                      </span>
                      <span className="font-bold text-indigo-700">{scanResult.asset}</span>
                    </div>
                  )}
                  {scanResult.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 font-medium">Auto Category:</span>
                      <span className="font-bold uppercase text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                        {scanResult.category}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setScanResult(null);
                    if (activeMode === "camera") {
                      startScanner(selectedCameraId);
                    }
                  }}
                  className="flex-1 py-3 px-4 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition"
                >
                  Scan Another Code
                </button>
                <button
                  type="button"
                  onClick={handleProceedToForm}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                >
                  <span>Auto-Fill Complaint</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeMode === "camera" && (
                <div className="space-y-4">
                  {cameraError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <p className="font-bold">Camera Access Error</p>
                        <p className="text-[11px] mt-0.5">{cameraError}</p>
                      </div>
                    </div>
                  )}

                  <div className="relative overflow-hidden rounded-2xl bg-neutral-950 border border-neutral-800 min-h-[320px] flex items-center justify-center shadow-inner">
                    <div id={containerId} className="w-full h-full" />

                    {!isScanning && !cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 gap-2 bg-neutral-950">
                        <RefreshCw className="w-7 h-7 animate-spin text-neutral-400" />
                        <span className="text-xs font-semibold">Starting camera stream...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl text-neutral-600 text-xs">
                    <Info className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>
                      Center the QR code in the viewport frame. The scanner will automatically detect and lock coordinates.
                    </span>
                  </div>
                </div>
              )}

              {activeMode === "upload" && (
                <div className="space-y-4 text-center">
                  <label className="border-2 border-dashed border-neutral-300 hover:border-black rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition group">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-200 group-hover:bg-neutral-300 flex items-center justify-center text-neutral-700 mb-4 transition">
                      <Upload className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold text-neutral-900">
                      {fileProcessing ? "Analyzing QR image..." : "Upload photo of QR code placard"}
                    </span>
                    <span className="text-xs text-neutral-500 mt-1">
                      Works with phone camera photos, screenshots, or downloaded QR PNG files
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
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-left flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right 1 Col: Quick One-Click Demo Presets & Info */}
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                Instant Demo Presets
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                Test the QR workflow instantly without pointing your camera:
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  applyDemoPreset({
                    block: "Hostel Block A (Boys)",
                    floor: "2nd Floor",
                    room: "Room 202",
                    category: "electrical",
                    asset: "Ceiling Fan #2"
                  })
                }
                className="w-full text-left p-3 rounded-2xl border border-neutral-200 hover:border-amber-400 hover:bg-amber-50/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 group-hover:text-amber-900">
                    Hostel Block A • Room 202
                  </span>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Asset: Ceiling Fan #2 • Electrical
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyDemoPreset({
                    block: "Hostel Block A (Boys)",
                    floor: "Ground Floor",
                    room: "Mess Area",
                    category: "food_mess",
                    asset: "Water Cooler RO-1"
                  })
                }
                className="w-full text-left p-3 rounded-2xl border border-neutral-200 hover:border-blue-400 hover:bg-blue-50/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 group-hover:text-blue-900">
                    Hostel Block A • Mess Area
                  </span>
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Asset: Water Cooler RO-1 • Food & Mess
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyDemoPreset({
                    block: "Academic Block - Ramanujan Wing",
                    floor: "1st Floor",
                    room: "Classroom 101",
                    category: "academic",
                    asset: "Epson Projector & Audio"
                  })
                }
                className="w-full text-left p-3 rounded-2xl border border-neutral-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 group-hover:text-indigo-900">
                    Ramanujan Wing • Class 101
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Asset: Epson Projector • Academic
                </p>
              </button>
            </div>
          </div>

          {/* How it works card */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              How SmartCMS QR Works
            </h4>
            <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Admins/Staff print QR door stickers from the QR Generator.</li>
              <li>Students scan the sticker using their phone camera or this portal.</li>
              <li>Block, Floor, and Room are locked into the ticket with zero typing errors.</li>
              <li>Existing issues in the room are highlighted for 1-click "Me Too" upvoting.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
