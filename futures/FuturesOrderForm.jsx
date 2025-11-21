import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, TrendingDown, Zap, Shield, DollarSign, Bitcoin, ArrowRight } from "lucide-react";
import UnifiedPairSelector from "../trades/UnifiedPairSelector";
import { useSingleCryptoPrice } from "../trades/useCryptoPrice";
import InternalTransferDialog from "./InternalTransferDialog";

export default function FuturesOrderForm({ account, onSubmit, isSubmitting, user }) {
  const [formData, setFormData] = useState({
    symbol: "BTC/USDT",
    side: "LONG",
    order_type: "MARKET",
    quantity: "",
    price: "",
    leverage: account?.default_leverage || 10,
    margin_mode: account?.margin_mode || "cross",
    take_profit: "",
    stop_loss: "",
  });

  const [marginPercentage, setMarginPercentage] = useState(10);
  const [displayCurrency, setDisplayCurrency] = useState("USDT");
  const [showTransfer, setShowTransfer] = useState(false);
  
  const btcPriceData = useSingleCryptoPrice("BTC/USDT");
  const btcPrice = btcPriceData?.price || 50000;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (account) {
      const availableBalance = account.available_balance || 0;
      const marginAmount = (availableBalance * marginPercentage) / 100;
      
      if (marginAmount > 0 && btcPrice > 0) {
        const notionalValue = marginAmount * formData.leverage;
        const quantity = notionalValue / btcPrice;
        handleChange('quantity', quantity.toFixed(6));
      }
    }
  }, [marginPercentage, formData.leverage, account, btcPrice]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const availableBalance = account ? account.available_balance : 0;
  const marginAmount = (availableBalance * marginPercentage) / 100;
  const notionalValue = marginAmount * formData.leverage;

  const marginInBTC = btcPrice > 0 ? marginAmount / btcPrice : 0;
  const notionalInBTC = btcPrice > 0 ? notionalValue / btcPrice : 0;

  return (
    <>
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 sticky top-24">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Nova Ordem
            </h3>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTransfer(true)}
                className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                title="Transferir Saldo"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
                <button
                  onClick={() => setDisplayCurrency("USDT")}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    displayCurrency === "USDT"
                      ? "bg-emerald-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <DollarSign className="w-3 h-3 inline mr-1" />
                  USDT
                </button>
                <button
                  onClick={() => setDisplayCurrency("BTC")}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    displayCurrency === "BTC"
                      ? "bg-orange-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Bitcoin className="w-3 h-3 inline mr-1" />
                  BTC
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm mb-2">Par</Label>
              <UnifiedPairSelector
                value={formData.symbol}
                onChange={(value) => handleChange('symbol', value)}
                type="futures"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => handleChange('side', 'LONG')}
                className={`h-12 font-bold ${
                  formData.side === 'LONG'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                LONG
              </Button>
              <Button
                type="button"
                onClick={() => handleChange('side', 'SHORT')}
                className={`h-12 font-bold ${
                  formData.side === 'SHORT'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                SHORT
              </Button>
            </div>

            <div>
              <Label className="text-slate-300 text-sm mb-2">Tipo de Ordem</Label>
              <Select value={formData.order_type} onValueChange={(value) => handleChange('order_type', value)}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="MARKET" className="text-white">Mercado</SelectItem>
                  <SelectItem value="LIMIT" className="text-white">Limite</SelectItem>
                  <SelectItem value="STOP_MARKET" className="text-white">Stop Mercado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-slate-300 text-sm flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  Alavancagem
                </Label>
                <span className="text-yellow-400 font-bold">{formData.leverage}x</span>
              </div>
              <Slider
                value={[formData.leverage]}
                onValueChange={([value]) => handleChange('leverage', value)}
                min={1}
                max={125}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1x</span>
                <span>25x</span>
                <span>50x</span>
                <span>75x</span>
                <span>100x</span>
                <span>125x</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-slate-300 text-sm flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-400" />
                  Margem Alocada
                </Label>
                <span className="text-blue-400 font-bold">{marginPercentage}%</span>
              </div>
              <Slider
                value={[marginPercentage]}
                onValueChange={([value]) => setMarginPercentage(value)}
                min={1}
                max={100}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <Label className="text-slate-300 text-sm mb-2 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Modo de Margem
              </Label>
              <Select value={formData.margin_mode} onValueChange={(value) => handleChange('margin_mode', value)}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="cross" className="text-white">Cross (Cruzada)</SelectItem>
                  <SelectItem value="isolated" className="text-white">Isolada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.order_type === "LIMIT" && (
              <div>
                <Label className="text-slate-300 text-sm mb-2">Preço</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-2">Take Profit</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.take_profit}
                  onChange={(e) => handleChange('take_profit', e.target.value)}
                  placeholder="Opcional"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-2">Stop Loss</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.stop_loss}
                  onChange={(e) => handleChange('stop_loss', e.target.value)}
                  placeholder="Opcional"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Margem:</span>
                <div className="text-right">
                  {displayCurrency === "USDT" ? (
                    <>
                      <div className="text-white font-bold">$ {marginAmount.toFixed(2)}</div>
                      <div className="text-xs text-slate-500">≈ {marginInBTC.toFixed(6)} BTC</div>
                    </>
                  ) : (
                    <>
                      <div className="text-white font-bold">{marginInBTC.toFixed(6)} BTC</div>
                      <div className="text-xs text-slate-500">≈ $ {marginAmount.toFixed(2)}</div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Valor Nocional:</span>
                <div className="text-right">
                  {displayCurrency === "USDT" ? (
                    <>
                      <div className="text-white font-bold">$ {notionalValue.toFixed(2)}</div>
                      <div className="text-xs text-slate-500">≈ {notionalInBTC.toFixed(6)} BTC</div>
                    </>
                  ) : (
                    <>
                      <div className="text-white font-bold">{notionalInBTC.toFixed(6)} BTC</div>
                      <div className="text-xs text-slate-500">≈ $ {notionalValue.toFixed(2)}</div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Quantidade:</span>
                <span className="text-white font-bold">{formData.quantity || '0.000000'}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!formData.quantity || isSubmitting}
              className={`w-full h-12 font-bold ${
                formData.side === 'LONG'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              } text-white shadow-lg`}
            >
              {isSubmitting ? "Enviando..." : `Abrir ${formData.side}`}
            </Button>
          </form>
        </div>
      </Card>

      <InternalTransferDialog 
        open={showTransfer}
        onOpenChange={setShowTransfer}
        user={user}
      />
    </>
  );
}