'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  QrCode, 
  Keyboard, 
  CheckCircle, 
  XOctagon, 
  Camera, 
  Loader2, 
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScanTerminalPage() {
  const { scanToken } = useApp();
  
  const [manualTokenId, setManualTokenId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
  } | null>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Initialize html5-qrcode scanner
  useEffect(() => {
    if (scanning) {
      // Small timeout to allow element container rendering
      setTimeout(() => {
        try {
          const scanner = new Html5QrcodeScanner(
            "reader", 
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            /* verbose= */ false
          );
          
          scanner.render(
            async (decodedText) => {
              // On scan success
              scanner.clear();
              setScanning(false);
              await handleTokenScan(decodedText);
            }, 
            (error) => {
              // Silent error during scanning frame search
            }
          );
          
          scannerRef.current = scanner;
        } catch (err) {
          console.error("Failed to start scanner:", err);
        }
      }, 300);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner clean error:", err));
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  const handleTokenScan = async (tokenId: string) => {
    setScanFeedback(null);
    const result = await scanToken(tokenId.trim());
    setScanFeedback({
      success: result.success,
      message: result.message,
      studentName: result.studentName
    });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenId) return;
    await handleTokenScan(manualTokenId);
    setManualTokenId('');
  };

  const toggleScanner = () => {
    if (scanning) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error(err));
        scannerRef.current = null;
      }
      setScanning(false);
    } else {
      setScanFeedback(null);
      setScanning(true);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24 md:pb-12">
      
      {/* Return Navigation */}
      <div className="mb-6">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-2">QR Scan Terminal 🎟️</h2>
        <p className="text-xs text-slate-500">Scan student codes at the serving counter to track attendance.</p>
      </div>

      {/* Main Terminal Screen */}
      <div className="bg-slate-950 rounded-3xl border border-slate-900 p-6 text-slate-100 shadow-2xl mb-6">
        
        {/* Viewfinder Screen */}
        <div className="relative aspect-square w-full rounded-2xl bg-black flex flex-col items-center justify-center border border-slate-900 overflow-hidden mb-6">
          
          {scanning ? (
            <div className="w-full h-full flex flex-col justify-between">
              {/* html5-qrcode element container */}
              <div id="reader" className="w-full h-full"></div>
              
              <button 
                onClick={toggleScanner}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-full bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Close Camera
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-6">
              <QrCode className="h-16 w-16 text-emerald-500 mb-4 animate-pulse" />
              <h3 className="text-sm font-bold">Counter Scanner Idle</h3>
              <p className="text-[10px] text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                Activate the device camera to begin scanning QR meal codes, or type the code ID manually using the fallback console below.
              </p>
              
              <button
                onClick={toggleScanner}
                className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-700 transition-all hover:scale-[1.02] flex items-center gap-1.5"
              >
                <Camera className="h-4 w-4" />
                Activate Camera
              </button>
            </div>
          )}

          {/* Grid target scanner graphic Overlay */}
          {scanning && (
            <div className="pointer-events-none absolute inset-0 border-[3px] border-emerald-500/20 m-12 rounded-xl">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400"></div>
              
              {/* Laser line effect */}
              <div className="w-full h-0.5 bg-emerald-400 shadow-lg shadow-emerald-400/50 absolute top-1/2 animate-bounce"></div>
            </div>
          )}

        </div>

        {/* Scan Status Feedback Message */}
        {scanFeedback && (
          <div className={`rounded-2xl p-4 border mb-6 transition-all ${
            scanFeedback.success 
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' 
              : 'bg-red-950/30 border-red-900/40 text-red-300'
          }`}>
            <div className="flex gap-3">
              <div className="mt-0.5">
                {scanFeedback.success ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500 fill-emerald-950" />
                ) : (
                  <XOctagon className="h-5 w-5 text-red-500 fill-red-950" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {scanFeedback.success ? 'Access Granted' : 'Access Denied'}
                </h4>
                {scanFeedback.studentName && (
                  <p className="text-sm font-extrabold text-white mt-1">
                    Student: {scanFeedback.studentName}
                  </p>
                )}
                <p className="text-xs font-semibold text-slate-300 mt-1">
                  {scanFeedback.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Console / Terminal Manual Input Fallback */}
        <div className="border-t border-slate-900 pt-6">
          <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <Keyboard className="h-4 w-4 text-emerald-500" />
            Manual Fallback Console
          </h4>
          
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Ticket ID (e.g. tok_demo_active_dinner)"
              value={manualTokenId}
              onChange={(e) => setManualTokenId(e.target.value)}
              className="flex-1 rounded-xl bg-black border border-slate-800 px-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 font-mono tracking-wide"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white text-xs font-extrabold px-5 transition-colors"
            >
              Verify
            </button>
          </form>
          
          {/* Helper suggestion link for quick testing */}
          <div className="mt-3 bg-slate-950 border border-dashed border-slate-900 rounded-xl p-3">
            <p className="text-[10px] text-slate-500 leading-normal font-semibold">
              💡 **Quick Testing Tip:** Copy/Paste `tok_demo_active_dinner` into the box above to verify the serving plates increment, and notice the live feed updates!
            </p>
          </div>
        </div>

      </div>

      {/* Counter Guidelines */}
      <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 text-slate-600 text-xs">
        <h5 className="font-bold text-slate-800 mb-1">Serving Desk Regulations:</h5>
        <ul className="list-disc pl-4 space-y-1 text-slate-500">
          <li>Always verify that the scanner reports "Access Granted".</li>
          <li>In case of scanner camera lag, request student to increase phone brightness.</li>
          <li>For invalid codes, refer student to the Mess Office desk.</li>
        </ul>
      </div>

    </div>
  );
}
