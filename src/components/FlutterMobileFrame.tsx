import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Smartphone,
  Maximize2,
  BellRing,
  Code2,
  RotateCcw,
  Wifi,
  Battery,
  Signal,
  Palette,
  Download,
  Check,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface FlutterMobileFrameProps {
  children: React.ReactNode;
  onOpenNotifications: () => void;
  onOpenCodeExport: () => void;
  onResetData: () => void;
  isPhoneFrame: boolean;
  setIsPhoneFrame: (val: boolean) => void;
  themeStyle: 'material3' | 'cupertino';
  setThemeStyle: (val: 'material3' | 'cupertino') => void;
}

export const FlutterMobileFrame: React.FC<FlutterMobileFrameProps> = ({
  children,
  onOpenNotifications,
  onOpenCodeExport,
  onResetData,
  isPhoneFrame,
  setIsPhoneFrame,
  themeStyle,
  setThemeStyle,
}) => {
  const currentTime = new Date().toLocaleTimeString('be-BY', { hour: '2-digit', minute: '2-digit' });
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 3000);
    }
  };

  if (Capacitor.isNativePlatform()) {
    return (
      <div
        className="min-h-[100dvh] bg-slate-950 text-slate-100"
        style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-2 sm:p-4 md:p-6">
      {/* Top Desktop & Mobile Controls Bar */}
      <header className="mb-3 flex w-full max-w-4xl items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2.5">
          {/* Flutter logo badge */}
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 text-white font-black text-xs shadow-md shadow-sky-500/20">
            FL
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">
                TaskPulse Flutter
              </h1>
              <span className="rounded-md bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.2 text-[10px] font-medium text-indigo-300">
                Android + M3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Аўтаномныя чэк-лісты і тэлефонныя апавяшчэнні (100% афлайн)
            </p>
          </div>
        </div>

        {/* Action Buttons in Belarusian */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Android In-App PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all shadow-sm"
              title="Усталяваць на прыладу Android"
            >
              {installSuccess ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">
                {installSuccess ? 'Усталявана!' : 'Усталяваць на Android'}
              </span>
            </button>
          )}

          {/* Theme Switcher: M3 vs Cupertino */}
          <button
            type="button"
            onClick={() => setThemeStyle(themeStyle === 'material3' ? 'cupertino' : 'material3')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 hover:border-indigo-500 hover:text-white transition-colors"
            title="Пераключыць стыль: Material 3 / Cupertino"
          >
            <Palette className="h-3.5 w-3.5 text-indigo-400" />
            <span className="capitalize hidden sm:inline">{themeStyle}</span>
          </button>

          {/* Frame Viewport Toggle: Phone vs Responsive */}
          <button
            type="button"
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs transition-colors ${
              isPhoneFrame
                ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Пераключыць рэжым адлюстравання"
          >
            {isPhoneFrame ? <Smartphone className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isPhoneFrame ? 'Тэлефон' : 'Поўны экран'}</span>
          </button>

          {/* Flutter Dart & Android Code Exporter */}
          <button
            type="button"
            onClick={onOpenCodeExport}
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20 transition-colors"
            title="Зыходны код Flutter Dart і зборка для Android"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Android & Dart</span>
          </button>

          {/* Phone Notifications Button */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 active:scale-95 transition-all shadow-sm"
            title="Налады апавяшчэнняў і сігналаў на тэлефоне"
          >
            <BellRing className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Апавяшчэнні</span>
          </button>

          {/* Reset sample data */}
          <button
            type="button"
            onClick={onResetData}
            aria-label="Скінуць да дэма-даных"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            title="Скінуць да дэма-даных"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main Canvas / Device Area */}
      <main className="w-full flex justify-center items-start">
        {isPhoneFrame ? (
          /* Phone Frame Container */
          <div className="relative w-full max-w-[420px] rounded-[44px] border-[8px] border-slate-800 bg-slate-950 shadow-2xl shadow-indigo-950/40 ring-1 ring-slate-700/60 overflow-hidden min-h-[760px] flex flex-col">
            {/* Phone Speaker / Dynamic Island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center">
              <div className="h-5 w-28 rounded-full bg-slate-900 border border-slate-800/80 shadow-inner flex items-center justify-between px-2.5">
                <div className="h-2 w-2 rounded-full bg-slate-800" />
                <div className="h-2.5 w-2.5 rounded-full bg-slate-950 ring-1 ring-slate-800" />
              </div>
            </div>

            {/* Mobile Status Bar */}
            <div className="pt-2 px-6 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 select-none z-30">
              <span className="cursor-pointer hover:text-white" onClick={onOpenNotifications} title="Налады апавяшчэнняў">
                {currentTime}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  title="Тэлефонныя апавяшчэнні і сігналы"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <BellRing className="h-3 w-3" />
                </button>
                <Signal className="h-3 w-3" />
                <Wifi className="h-3 w-3" />
                <Battery className="h-3 w-3" />
              </div>
            </div>

            {/* Flutter Mobile Content View */}
            <div className="flex-1 flex flex-col overflow-y-auto px-4 pt-2">
              {children}
            </div>

            {/* Home Indicator Bar */}
            <div className="py-1.5 flex justify-center bg-slate-950 select-none">
              <div className="h-1 w-32 rounded-full bg-slate-600/70" />
            </div>
          </div>
        ) : (
          /* Expanded Full-Canvas Layout */
          <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur shadow-2xl">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
