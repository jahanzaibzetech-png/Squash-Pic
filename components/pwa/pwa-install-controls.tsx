'use client';

import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '@/hooks/use-pwa-install';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, swRegistered, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowModal(true);
          }
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#FFFFFF] text-[#171A24] border border-[#E5E2DA] rounded-lg hover:border-[#171A24] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        title="Install squash as an offline desktop or mobile app"
      >
        <Download className="w-3.5 h-3.5 text-[#8178FF]" />
        <span>{isIOS ? 'Install on iOS' : 'Install Offline App'}</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#171A24]/60 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-[#FFFFFF] border border-[#E5E2DA] p-6 shadow-xl space-y-4 text-[#171A24]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#171A24] text-[#D7FF64] flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">
                    Install squash as an Offline App
                  </h3>
                  <p className="text-xs text-[#6E7280]">
                    Works 100% offline with local browser processing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-[#6E7280] hover:text-[#171A24] rounded cursor-pointer"
                aria-label="Close installation guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="p-3.5 rounded-lg bg-[#F7F5F0] border border-[#E5E2DA] space-y-2 text-xs leading-relaxed">
                <p className="font-semibold text-[#171A24]">Install on iPhone or iPad:</p>
                <ol className="list-decimal pl-4 space-y-1 text-[#6E7280]">
                  <li>
                    Tap the <strong className="text-[#171A24]">Share</strong> icon in the Safari toolbar.
                  </li>
                  <li>
                    Scroll down and select <strong className="text-[#171A24]">Add to Home Screen</strong>.
                  </li>
                  <li>
                    Launch <strong className="text-[#171A24]">squash</strong> anytime—even without internet.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-[#F7F5F0] border border-[#E5E2DA] space-y-2 text-xs leading-relaxed">
                <p className="font-semibold text-[#171A24]">Install on Desktop or Android:</p>
                <ol className="list-decimal pl-4 space-y-1 text-[#6E7280]">
                  <li>
                    Open this app in its own browser tab (if currently inside a preview frame).
                  </li>
                  <li>
                    Click the <strong className="text-[#171A24]">Install squash</strong> icon in your browser&apos;s address bar (Chrome, Edge, Brave) or browser menu.
                  </li>
                </ol>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 text-xs text-[#6E7280]">
              <span className="inline-flex items-center gap-1.5 text-[#227A55] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {swRegistered ? 'Offline Service Worker Active' : 'Local Engine Ready'}
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 font-semibold bg-[#171A24] text-[#FFFFFF] rounded-lg hover:bg-[#2A2F42] transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#171A24] border border-[#D7FF64] px-3.5 py-2 text-xs font-medium text-[#FFFFFF] shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#D7FF64] shrink-0" />
      <span>Offline Mode — Local image processing works normally without internet.</span>
    </div>
  );
}
