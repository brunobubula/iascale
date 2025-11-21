import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Shield, Loader2 } from "lucide-react";

export default function PINProtectionDialog({ open, onOpenChange, onSuccess, feature }) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (pin.length !== 4) {
      setError("PIN deve ter 4 dígitos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await base44.functions.invoke('verifyPIN', {
        pin,
        action: 'verify'
      });

      if (response.data.valid) {
        onSuccess();
        onOpenChange(false);
        setPin("");
      } else {
        setError("PIN incorreto");
      }
    } catch (err) {
      setError("Erro ao verificar PIN");
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Verificação de Segurança
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Esta ação está protegida por PIN. Digite seu PIN de 4 dígitos para continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              PIN de Segurança
            </label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={handlePinChange}
              placeholder="••••"
              className="bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-400 text-xs">
              💡 Esta proteção garante que apenas você pode executar ações importantes
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setPin("");
              setError("");
            }}
            className="flex-1 bg-slate-800 border-slate-700 text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleVerify}
            disabled={pin.length !== 4 || loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Verificar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}