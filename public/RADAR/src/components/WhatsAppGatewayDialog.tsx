/* ------------------------------------------------------------------ */
/*  ProspectRadar — Session WhatsApp via GoSite API                    */
/*  Même système que /settings : Baileys via /api/whatsapp/session     */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  X,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (url?: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

interface SessionStatus {
  status: string;
  connected: boolean;
  phoneNumber?: string;
  profileName?: string;
  qrCode?: string;
  error?: string;
}

export function isWhatsAppSessionActive(): boolean {
  return false;
}

export default function WhatsAppGatewayDialog({ open, onClose, onConnectionChange }: Props) {
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; info?: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/session");
      const data = await res.json();
      setSession(data);
      onConnectionChange?.(data.connected === true);

      if (data.connected || data.status === "failed" || data.status === "disconnected") {
        stopPolling();
      }
    } catch {
      setSession({ status: "error", connected: false, error: "Impossible de contacter le serveur" });
      stopPolling();
    }
  }, [onConnectionChange, stopPolling]);

  const startSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/session", { method: "POST" });
      const data = await res.json();
      setSession(data);
      setLoading(false);

      if (data.status === "qr_ready" || data.status === "connecting") {
        stopPolling();
        pollRef.current = setInterval(pollStatus, 1200);
      }
    } catch {
      setSession({ status: "error", connected: false, error: "Erreur lors de la connexion" });
      setLoading(false);
    }
  }, [pollStatus, stopPolling]);

  const disconnect = useCallback(async () => {
    try {
      await fetch("/api/whatsapp/session", { method: "DELETE" });
      setSession({ status: "disconnected", connected: false });
      onConnectionChange?.(false);
    } catch { /* ignore */ }
  }, [onConnectionChange]);

  const handleTest = useCallback(async () => {
    if (!testPhone.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone.trim(), message: testMsg.trim() || undefined }),
      });
      const data = await res.json();
      setTestResult({
        ok: data.ok === true,
        info: data.ok
          ? `Envoyé depuis ${data.sentFrom} → ${data.sentTo}`
          : data.error || "Échec de l'envoi",
      });
    } catch {
      setTestResult({ ok: false, info: "Erreur réseau" });
    }
    setTesting(false);
  }, [testPhone, testMsg]);

  useEffect(() => {
    if (open) {
      pollStatus();
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [open, pollStatus, stopPolling]);

  const statusLabel = session?.connected
    ? "Connecté"
    : session?.status === "qr_ready"
      ? "Scannez le QR"
      : session?.status === "connecting"
        ? "Connexion..."
        : session?.status === "failed"
          ? "Échec"
          : "Non connecté";

  const statusColor = session?.connected
    ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
    : session?.status === "qr_ready" || session?.status === "connecting"
      ? "text-violet-400 border-violet-400/30 bg-violet-400/10"
      : session?.status === "failed"
        ? "text-red-400 border-red-400/30 bg-red-400/10"
        : "text-zinc-400 border-zinc-400/20 bg-zinc-400/5";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/90 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-radar/30 bg-radar/10 text-radar">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-zinc-100">
                    WhatsApp Session
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">
                    Baileys via GoSite API
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg border border-line p-2 text-mist hover:text-zinc-100"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] space-y-5 overflow-y-auto px-6 py-5">
              {/* Status Badge */}
              <div className={`rounded-xl border p-3 text-center text-[13px] font-semibold ${statusColor}`}>
                {session?.connected && <CheckCircle2 className="mr-1.5 inline h-4 w-4" />}
                {session?.status === "qr_ready" && <RefreshCw className="mr-1.5 inline h-4 w-4 animate-spin" />}
                {statusLabel}
              </div>

              {/* Connected Info */}
              {session?.connected && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 text-[13px]">
                    <Phone className="h-4 w-4" />
                    <span className="font-semibold">{session.phoneNumber}</span>
                    {session.profileName && (
                      <span className="text-fog">— {session.profileName}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-fog">
                    WhatsApp connecté via Baileys WebSocket. Les numéros seront vérifiés automatiquement lors du radar.
                  </p>
                  <button
                    onClick={disconnect}
                    className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-2 text-[12px] font-semibold text-red-300 hover:bg-red-400/20"
                  >
                    Déconnecter
                  </button>
                </div>
              )}

              {/* QR Code */}
              {session?.qrCode && !session.connected && (
                <div className="space-y-3 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 text-center">
                  <p className="text-[12px] font-semibold text-violet-300">
                    Scannez ce QR code avec votre téléphone
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={session.qrCode}
                      alt="QR Code WhatsApp"
                      className="h-56 w-56 rounded-lg border border-violet-400/30"
                    />
                  </div>
                  <div className="space-y-1 text-[11px] text-fog">
                    <p>1. Ouvrez WhatsApp sur votre téléphone</p>
                    <p>2. Allez dans <strong>Appareils reliés</strong></p>
                    <p>3. Appuyez sur <strong>Relier un appareil</strong></p>
                    <p>4. Scannez le QR code ci-dessus</p>
                  </div>
                  <button
                    onClick={startSession}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-violet-400/30 px-3 py-1.5 text-[11px] font-medium text-violet-300 hover:bg-violet-400/10"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Régénérer le QR
                  </button>
                </div>
              )}

              {/* Connect Button */}
              {!session?.connected && !session?.qrCode && (
                <button
                  onClick={startSession}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-5 py-3 font-display text-[13px] font-semibold text-ink hover:bg-radar disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                  {session?.status === "failed" ? "Reconnecter" : "Connecter WhatsApp"}
                </button>
              )}

              {/* Error */}
              {session?.error && !session.connected && (
                <p className="text-center text-[11px] text-red-400">{session.error}</p>
              )}

              {/* Test Panel */}
              {session?.connected && (
                <div className="space-y-2.5 rounded-xl border border-line bg-ink/40 p-4">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-fog">
                    Envoyer un message test
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="Numéro (ex: +212600000000)"
                      className="flex-1 rounded-xl border border-line bg-ink px-3.5 py-2 font-mono text-[12.5px] text-zinc-100 placeholder:text-fog/40 focus:border-lime/60 focus:outline-none"
                    />
                    <button
                      onClick={handleTest}
                      disabled={testing || !testPhone.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-lime px-4 py-2 font-display text-[12px] font-semibold text-ink hover:bg-radar disabled:opacity-50"
                    >
                      {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Envoyer
                    </button>
                  </div>
                  <input
                    type="text"
                    value={testMsg}
                    onChange={(e) => setTestMsg(e.target.value)}
                    placeholder="Message (optionnel)"
                    className="w-full rounded-xl border border-line bg-ink px-3.5 py-2 font-mono text-[12.5px] text-zinc-100 placeholder:text-fog/40 focus:border-lime/60 focus:outline-none"
                  />
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-2 rounded-lg border p-2.5 text-[11.5px] ${
                        testResult.ok
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                          : "border-red-400/40 bg-red-400/10 text-red-300"
                      }`}
                    >
                      <p className="font-semibold flex items-center gap-1.5">
                        {testResult.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {testResult.ok ? "Message envoyé" : "Échec"}
                      </p>
                      <p className="mt-1 text-[10.5px] opacity-80">{testResult.info}</p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-line px-6 py-4">
              <button
                onClick={onClose}
                className="rounded-xl bg-lime px-5 py-2 font-display text-[12.5px] font-semibold text-ink hover:bg-radar"
              >
                {session?.connected ? "Terminé" : "Fermer"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
