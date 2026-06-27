import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Upload, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'file'
  const [initializing, setInitializing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Restart / initialize camera scanning when modal opens or camera index changes
  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      setInitializing(true);
      setCameraError(null);
      setIsScanning(false);

      const timer = setTimeout(() => {
        const qrContainer = document.getElementById('qr-reader-viewport');
        if (!qrContainer) {
          setInitializing(false);
          return;
        }

        const html5QrCode = new Html5Qrcode('qr-reader-viewport');
        html5QrCodeRef.current = html5QrCode;

        // Configuration for the QR Box and Scan FPS
        const config = { 
          fps: 15, 
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.65;
            return { width: size, height: size };
          }
        };

        // Determine camera target (preferring rear camera by default)
        const cameraTarget = cameras.length > 0 
          ? cameras[currentCameraIndex].id 
          : { facingMode: 'environment' };

        html5QrCode.start(
          cameraTarget,
          config,
          (decodedText) => {
            // Success handler
            onScanSuccess(decodedText);
            cleanupScanner();
            onClose();
          },
          (errorMessage) => {
            // Quietly ignore scan failures per frame
          }
        )
        .then(() => {
          setInitializing(false);
          setIsScanning(true);
          
          // Fetch cameras list if we haven't already
          if (cameras.length === 0) {
            Html5Qrcode.getCameras()
              .then(devices => {
                if (devices && devices.length > 0) {
                  setCameras(devices);
                }
              })
              .catch(err => console.warn('Failed to retrieve list of cameras:', err));
          }
        })
        .catch(err => {
          console.error('Failed to start QR camera:', err);
          setCameraError(
            err.message || 'Camera access denied or device is not available. Please try the "Upload QR Image" option.'
          );
          setInitializing(false);
        });
      }, 400); // Small timeout to ensure DOM is fully ready

      return () => {
        clearTimeout(timer);
        cleanupScanner();
      };
    } else {
      cleanupScanner();
    }
  }, [isOpen, scanMode, currentCameraIndex]);

  const cleanupScanner = () => {
    if (html5QrCodeRef.current) {
      if (html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop()
          .then(() => {
            html5QrCodeRef.current = null;
          })
          .catch(err => console.warn('Scanner stop warning during cleanup:', err));
      } else {
        html5QrCodeRef.current = null;
      }
    }
    setIsScanning(false);
  };

  // Flip cameras if multiple are available
  const handleToggleCamera = () => {
    if (cameras.length > 1) {
      cleanupScanner();
      setCurrentCameraIndex((prevIndex) => (prevIndex + 1) % cameras.length);
    }
  };

  // Handle uploaded QR image files
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileError(null);
    const html5QrCode = new Html5Qrcode('qr-reader-hidden-viewport');

    html5QrCode.scanFile(file, true)
      .then(decodedText => {
        onScanSuccess(decodedText);
        html5QrCode.clear();
        onClose();
      })
      .catch(err => {
        console.error('Failed to parse QR from image file:', err);
        setFileError('Could not decode a valid QR code from this image. Please make sure the code is centered and clear.');
        html5QrCode.clear();
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900/95 max-h-[90vh] flex flex-col overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-650 animate-pulse" />
            Scan Lot / Crop QR Code
          </h3>
          <button 
            onClick={() => { cleanupScanner(); onClose(); }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl my-4">
          <button
            onClick={() => { setScanMode('camera'); setFileError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              scanMode === 'camera'
                ? 'bg-white text-emerald-600 dark:bg-slate-900 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-300'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            Live Camera Scan
          </button>
          <button
            onClick={() => { setScanMode('file'); setCameraError(null); cleanupScanner(); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              scanMode === 'file'
                ? 'bg-white text-emerald-600 dark:bg-slate-900 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload QR Image
          </button>
        </div>

        {/* Scanner Viewport / Upload Area */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[260px] relative">
          
          {/* CAMERA SCANNING MODE */}
          {scanMode === 'camera' && (
            <div className="w-full flex flex-col items-center relative">
              <div 
                id="qr-reader-viewport" 
                className="w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-300 dark:border-slate-800 relative shadow-inner"
              >
                {/* Custom Glowing Green Line Scanning Overlay */}
                {isScanning && !initializing && (
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_3px_rgba(16,185,129,0.85)] z-10 pointer-events-none animate-scan-line"></div>
                )}
              </div>

              {initializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 rounded-2xl max-w-[280px] mx-auto z-15">
                  <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin mb-2" />
                  <span className="text-xs text-emerald-100 font-medium">Starting Camera feed...</span>
                </div>
              )}

              {cameraError && (
                <div className="mt-4 px-4 py-3 rounded-xl border border-rose-100 bg-rose-50/50 text-rose-600 dark:border-rose-950/20 dark:bg-rose-950/20 dark:text-rose-400 text-xs font-semibold max-w-[280px] flex gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{cameraError}</p>
                </div>
              )}

              {/* Camera selection control if multi-cameras present */}
              {cameras.length > 1 && isScanning && (
                <button
                  onClick={handleToggleCamera}
                  className="mt-4 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 transition flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Switch Camera ({cameras[currentCameraIndex].label ? cameras[currentCameraIndex].label.substring(0, 15) : `Camera ${currentCameraIndex + 1}`})
                </button>
              )}
            </div>
          )}

          {/* FILE SCANNING MODE */}
          {scanMode === 'file' && (
            <div className="w-full max-w-[280px] flex flex-col items-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 group hover:shadow-md"
              >
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-105 transition-transform duration-300 mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Select QR Code Image
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Drag and drop, or click to browse (PNG, JPG)
                </span>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />

              {fileError && (
                <div className="mt-4 px-4 py-3 rounded-xl border border-rose-100 bg-rose-50/50 text-rose-600 dark:border-rose-950/20 dark:bg-rose-950/20 dark:text-rose-455 text-xs font-semibold flex gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{fileError}</p>
                </div>
              )}
            </div>
          )}

          {/* Hidden element required for html5-qrcode image scanning */}
          <div id="qr-reader-hidden-viewport" className="hidden"></div>
        </div>

        {/* Footer info banner */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
            Decodes standard AgroChain generated crop and batch product QR labels. Point camera at the QR code, or take a picture to upload.
          </p>
        </div>

        {/* Global style inject for scan line keyframes */}
        <style>{`
          @keyframes scanLineAnimation {
            0% { top: 0%; opacity: 0.8; }
            50% { top: 100%; opacity: 1; }
            100% { top: 0%; opacity: 0.8; }
          }
          .animate-scan-line {
            animation: scanLineAnimation 2.2s linear infinite;
          }
        `}</style>

      </div>
    </div>
  );
}
