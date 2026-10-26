import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  Building,
  Layers,
  DoorClosed,
  Zap,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Grid,
  FileText
} from "lucide-react";
import api from "../api/axios";

export const QrGeneratorPage = () => {
  const [locationsTree, setLocationsTree] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Form State
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [assetName, setAssetName] = useState("");
  const [category, setCategory] = useState("");
  const [institutionName, setInstitutionName] = useState("SMART COLLEGE OF ENGINEERING & TECHNOLOGY");

  // Generator View Modes
  const [generatorMode, setGeneratorMode] = useState("single"); // 'single' | 'batch'
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [batchQrs, setBatchQrs] = useState([]);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [copied, setCopied] = useState(false);

  const printAreaRef = useRef(null);

  // Fetch cascading campus locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get("/complaints/locations");
        if (res.data?.success) {
          const list = res.data.data.locations || [];
          setLocationsTree(list);
          if (list.length > 0) {
            setSelectedBlock(list[0].block);
            if (list[0].floors?.length > 0) {
              setSelectedFloor(list[0].floors[0].floor);
              if (list[0].floors[0].rooms?.length > 0) {
                setSelectedRoom(list[0].floors[0].rooms[0]);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load locations:", err);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  const currentBlockData = locationsTree.find((b) => b.block === selectedBlock);
  const availableFloors = currentBlockData?.floors || [];
  const currentFloorData = availableFloors.find((f) => f.floor === selectedFloor);
  const availableRooms = currentFloorData?.rooms || [];

  const handleBlockChange = (blockName) => {
    setSelectedBlock(blockName);
    const bObj = locationsTree.find((b) => b.block === blockName);
    if (bObj?.floors?.length > 0) {
      setSelectedFloor(bObj.floors[0].floor);
      if (bObj.floors[0].rooms?.length > 0) {
        setSelectedRoom(bObj.floors[0].rooms[0]);
      }
    }
  };

  const handleFloorChange = (floorName) => {
    setSelectedFloor(floorName);
    const fObj = availableFloors.find((f) => f.floor === floorName);
    if (fObj?.rooms?.length > 0) {
      setSelectedRoom(fObj.rooms[0]);
    }
  };

  // Construct complaint URL for QR
  const constructComplaintUrl = (block, floor, room, asset = "", cat = "") => {
    const params = new URLSearchParams();
    if (block) params.set("block", block);
    if (floor) params.set("floor", floor);
    if (room) params.set("room", room);
    if (cat) params.set("category", cat);
    if (asset) params.set("asset", asset);
    params.set("qr", "true");

    return `${window.location.origin}/student/new?${params.toString()}`;
  };

  const activeUrl = constructComplaintUrl(
    selectedBlock,
    selectedFloor,
    selectedRoom,
    assetName,
    category
  );

  // Generate single QR Code data URL
  useEffect(() => {
    if (!selectedBlock || !selectedRoom) return;

    QRCode.toDataURL(activeUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 400,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR gen error:", err));
  }, [activeUrl, selectedBlock, selectedRoom]);

  // Generate batch QR codes for an entire floor
  const handleGenerateBatch = async () => {
    if (!currentFloorData || availableRooms.length === 0) return;
    setGeneratingBatch(true);

    try {
      const results = [];
      for (const room of availableRooms) {
        const url = constructComplaintUrl(selectedBlock, selectedFloor, room, "", category);
        const dataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: "H",
          margin: 2,
          width: 320,
          color: { dark: "#0f172a", light: "#ffffff" }
        });

        results.push({
          block: selectedBlock,
          floor: selectedFloor,
          room,
          url,
          dataUrl
        });
      }
      setBatchQrs(results);
      setGeneratorMode("batch");
    } catch (err) {
      console.error("Batch QR gen error:", err);
    } finally {
      setGeneratingBatch(false);
    }
  };

  // Download Single QR Image
  const handleDownloadSingle = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    const safeRoom = selectedRoom.replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `SmartCMS_QR_${selectedBlock}_${safeRoom}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  // Copy URL
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print Placard
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Print-only CSS rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-placard, #printable-qr-placard * {
            visibility: visible;
          }
          #printable-qr-placard {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-400/30">
            <QrCode className="w-3.5 h-3.5" />
            Smart Campus Infrastructure Suite
          </div>
          <h1 className="text-2xl font-black tracking-tight">QR Code Placard Generator</h1>
          <p className="text-xs text-neutral-300 mt-1 max-w-2xl">
            Generate printable, high-resolution QR placards for campus rooms, labs, hostel blocks, and equipment. Students can scan them with any smartphone camera to report grievances with zero typing.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setGeneratorMode(generatorMode === "single" ? "batch" : "single")}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-2 text-white"
          >
            {generatorMode === "single" ? (
              <>
                <Grid className="w-4 h-4 text-amber-300" />
                <span>Switch to Batch Mode</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-amber-300" />
                <span>Single Placard Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Location & Asset Configurator (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Location & Facility Target
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select the campus location to encode into the QR code
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Campus Block */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1.5">
                Campus Block / Facility:
              </label>
              <select
                value={selectedBlock}
                onChange={(e) => handleBlockChange(e.target.value)}
                disabled={loadingLocations}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-black outline-none"
              >
                {locationsTree.map((b) => (
                  <option key={b.block} value={b.block}>
                    {b.block}
                  </option>
                ))}
              </select>
            </div>

            {/* Floor Level */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1.5">
                Floor Level:
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => handleFloorChange(e.target.value)}
                disabled={loadingLocations || availableFloors.length === 0}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-black outline-none"
              >
                {availableFloors.map((f) => (
                  <option key={f.floor} value={f.floor}>
                    {f.floor}
                  </option>
                ))}
              </select>
            </div>

            {/* Room / Area */}
            {generatorMode === "single" && (
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Room / Specific Area:
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  disabled={loadingLocations || availableRooms.length === 0}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-black outline-none"
                >
                  {availableRooms.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Optional Asset Identifier */}
            {generatorMode === "single" && (
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                  <span>Specific Asset / Equipment Tag (Optional):</span>
                  <span className="text-[10px] text-neutral-400 font-normal">e.g. Fan 2, AC Unit</span>
                </label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="e.g. Ceiling Fan #2, RO Water Cooler 1"
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-black outline-none"
                />
              </div>
            )}

            {/* Optional Pre-set Category */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                <span>Default Category (Optional):</span>
                <span className="text-[10px] text-neutral-400 font-normal">Pre-locks category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-black outline-none"
              >
                <option value="">Any / Student Selects (Default)</option>
                <option value="electrical">Electrical & Power Systems</option>
                <option value="plumbing">Plumbing & Restrooms</option>
                <option value="leakage">Water Leakage & Drainage</option>
                <option value="food_mess">Hostel Mess & Canteen</option>
                <option value="wifi">Campus WiFi & Network</option>
                <option value="academic">Academic & Lab Equipments</option>
                <option value="hostel">Hostel Maintenance & Locks</option>
                <option value="cleaning">Housekeeping & Cleanliness</option>
              </select>
            </div>

            {/* College Header Title */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1.5">
                Placard Header Label:
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-black outline-none"
              />
            </div>

            {/* Batch Action Button */}
            {generatorMode === "batch" && (
              <button
                type="button"
                onClick={handleGenerateBatch}
                disabled={generatingBatch || availableRooms.length === 0}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {generatingBatch
                    ? "Generating Batch QR Codes..."
                    : `Generate QR for All ${availableRooms.length} Rooms in ${selectedFloor}`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Placard Preview & Print Ready Display (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {generatorMode === "single" ? (
            /* Single Placard View */
            <div className="space-y-4">
              <div
                id="printable-qr-placard"
                ref={printAreaRef}
                className="bg-white rounded-3xl p-8 border-2 border-neutral-900 shadow-xl text-center space-y-6 max-w-md mx-auto"
              >
                {/* College Emblem & Header */}
                <div className="border-b-2 border-neutral-900 pb-4">
                  <div className="inline-flex p-2 bg-neutral-900 text-amber-400 rounded-2xl mb-2 shadow-sm">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-xs font-black tracking-widest text-neutral-900 uppercase">
                    {institutionName}
                  </h3>
                  <p className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase mt-0.5">
                    Official Grievance & Facility Redressal Placard
                  </p>
                </div>

                {/* QR Code Graphic */}
                <div className="relative inline-block p-4 bg-white rounded-2xl border-2 border-neutral-900 shadow-md">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Room QR Code"
                      className="w-60 h-60 mx-auto object-contain"
                    />
                  ) : (
                    <div className="w-60 h-60 flex items-center justify-center text-xs text-neutral-400">
                      Generating QR...
                    </div>
                  )}

                  {/* Centered Logo Badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-neutral-900 flex items-center justify-center shadow-lg">
                      <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                  </div>
                </div>

                {/* Location Badge Box */}
                <div className="bg-neutral-50 border-2 border-neutral-900 rounded-2xl p-4 text-neutral-900 space-y-1">
                  <div className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
                    Location Identifier
                  </div>
                  <div className="text-base font-black tracking-tight text-neutral-900">
                    {selectedRoom || "Room"}
                  </div>
                  <div className="text-xs font-bold text-neutral-600">
                    {selectedBlock} • {selectedFloor}
                  </div>
                  {assetName && (
                    <div className="pt-1">
                      <span className="inline-block px-2.5 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-full text-[10px] font-bold">
                        Asset: {assetName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Scan Instruction Footer */}
                <div className="border-t border-neutral-200 pt-3 text-[11px] text-neutral-600 space-y-0.5 leading-tight">
                  <p className="font-bold text-neutral-900">
                    📱 Scan with any Camera to Report Grievance
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    புகார்களை உடனடியாக தெரிவிக்க கேமராவை கொண்டு ஸ்கேன் செய்யவும்
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleDownloadSingle}
                  className="flex-1 py-2.5 px-4 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Placard</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="py-2.5 px-3 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>

                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Test URL</span>
                </a>
              </div>
            </div>
          ) : (
            /* Batch Mode Grid View */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-200">
                <div>
                  <h3 className="text-xs font-bold text-neutral-900">
                    Batch Print: {selectedBlock} ({selectedFloor})
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {batchQrs.length > 0
                      ? `${batchQrs.length} QR placards ready for printing`
                      : "Click 'Generate Batch QR Codes' to generate all rooms"}
                  </p>
                </div>
                {batchQrs.length > 0 && (
                  <button
                    onClick={handlePrint}
                    className="py-2 px-4 bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-neutral-800"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print All Placards</span>
                  </button>
                )}
              </div>

              {batchQrs.length > 0 ? (
                <div id="printable-qr-placard" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {batchQrs.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-5 rounded-2xl border-2 border-neutral-900 shadow-sm text-center space-y-3"
                    >
                      <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        {institutionName}
                      </div>
                      <img
                        src={item.dataUrl}
                        alt={item.room}
                        className="w-36 h-36 mx-auto object-contain"
                      />
                      <div className="bg-neutral-50 p-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900">
                        {item.room}
                        <div className="text-[10px] font-normal text-neutral-500">
                          {item.block}
                        </div>
                      </div>
                      <p className="text-[9px] text-neutral-500">
                        Scan to report facility issues instantly
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-neutral-300 text-neutral-400">
                  <Grid className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                  <p className="text-xs font-bold text-neutral-700">No batch generated yet</p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Select a block & floor on the left, then click "Generate QR for All Rooms"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
