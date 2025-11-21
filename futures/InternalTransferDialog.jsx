import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Wallet, TrendingUp, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function InternalTransferDialog({ open, onOpenChange, user }) {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("to_futures");
  const queryClient = useQueryClient();

  const transferMutation = useMutation({
    mutationFn: async ({ amount, direction }) => {
      const transferAmount = parseFloat(amount);
      
      if (direction === "to_futures") {
        const newMainBalance = (user.account_balance || 0) - transferAmount;
        const newFuturesBalance = (user.futures_balance || 0) + transferAmount;
        
        await base44.auth.updateMe({
          account_balance: newMainBalance,
          futures_balance: newFuturesBalance
        });
      } else {
        const newFuturesBalance = (user.futures_balance || 0) - transferAmount;
        const newMainBalance = (user.account_balance || 0) + transferAmount;
        
        await base44.auth.updateMe({
          account_balance: newMainBalance,
          futures_balance: newFuturesBalance
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['futuresAccount'] });
      setAmount("");
      onOpenChange(false);
      alert("✅ Transferência realizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro na transferência:", error);
      alert("❌ Erro ao realizar transferência. Tente novamente.");
    }
  });

  const handleTransfer = () => {
    const transferAmount = parseFloat(amount);
    
    if (isNaN(transferAmount) || transferAmount <= 0) {
      alert("Digite um valor válido");
      return;
    }

    if (direction === "to_futures" && transferAmount > (user?.account_balance || 0)) {
      alert("Saldo insuficiente na Carteira Scale Cripto");
      return;
    }

    if (direction === "from_futures" && transferAmount > (user?.futures_balance || 0)) {
      alert("Saldo insuficiente na carteira Futuros Scale");
      return;
    }

    transferMutation.mutate({ amount: transferAmount, direction });
  };

  const mainBalance = user?.account_balance || 0;
  const futuresBalance = user?.futures_balance || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Transferência Interna
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Info Alert */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-300">
              <strong>Transferências Gratuitas:</strong> Mova saldo entre suas carteiras sem custos. A Carteira Scale Cripto está sincronizada com seu Saldo Inicial.
            </div>
          </div>

          {/* Balances Display */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="text-slate-400 text-xs mb-1">Carteira Scale Cripto</div>
              <div className="text-white font-bold">R$ {mainBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-emerald-500/30">
              <div className="text-slate-400 text-xs mb-1">Futuros Scale</div>
              <div className="text-emerald-400 font-bold">$ {futuresBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Direction Selector */}
          <div>
            <Label className="text-slate-300 text-sm mb-2">Direção da Transferência</Label>
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="to_futures" className="text-white">
                  Carteira Scale Cripto → Futuros Scale
                </SelectItem>
                <SelectItem value="from_futures" className="text-white">
                  Futuros Scale → Carteira Scale Cripto
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div>
            <Label className="text-slate-300 text-sm mb-2">Valor da Transferência</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
            <div className="flex justify-between mt-2">
              <button
                onClick={() => {
                  const available = direction === "to_futures" ? mainBalance : futuresBalance;
                  setAmount((available * 0.5).toFixed(2));
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                50%
              </button>
              <button
                onClick={() => {
                  const available = direction === "to_futures" ? mainBalance : futuresBalance;
                  setAmount(available.toFixed(2));
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Máximo
              </button>
            </div>
          </div>

          {/* Transfer Preview */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  {direction === "to_futures" ? "De: Carteira Scale Cripto" : "De: Futuros Scale"}
                </span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">
                  {direction === "to_futures" ? "Para: Futuros Scale" : "Para: Carteira Scale Cripto"}
                </span>
              </div>
              <div className="text-center mt-2">
                <span className="text-emerald-400 font-bold text-lg">
                  {direction === "to_futures" ? "R$" : "$"} {parseFloat(amount).toLocaleString(direction === "to_futures" ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!amount || parseFloat(amount) <= 0 || transferMutation.isPending}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
          >
            {transferMutation.isPending ? "Transferindo..." : "Transferir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}