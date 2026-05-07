import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pwa-install-dismissed';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isDismissed(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return false;
  }
  const ts = Number(raw);
  return !isNaN(ts) && Date.now() - ts < DISMISS_TTL_MS;
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
  const isStandalone = 'standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true;
  return isIos && isSafari && !isStandalone;
}

type Mode = 'android' | 'ios' | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [mode, setMode] = useState<Mode>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isDismissed()) {
      return;
    }

    if (isIosSafari()) {
      setMode('ios');
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode('android');
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setMode(null);
  };

  const install = async () => {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
    setMode(null);
    setDeferredPrompt(null);
  };

  if (!mode) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Instalar aplicación"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl">📲</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">IA Familiar</span>
        </div>

        {mode === 'android' ? (
          <>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
              ¡Instala <strong>IA Familiar</strong> en tu teléfono para un acceso rápido!
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={install}
                className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Instalar
              </button>
              <button
                onClick={dismiss}
                className="w-full rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Quizás más tarde
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
              Para instalar <strong>IA Familiar</strong>, toca el ícono de{' '}
              <strong>Compartir</strong> <span aria-hidden="true">⬆️</span> en tu navegador y
              selecciona <strong>«Añadir a la pantalla de inicio»</strong>.
            </p>
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700">
              <span className="text-xl">🔲</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Busca este ícono en la barra inferior de Safari
              </span>
            </div>
            <button
              onClick={dismiss}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Entendido
            </button>
          </>
        )}
      </div>
    </div>
  );
}
