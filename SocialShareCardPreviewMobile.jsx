import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SocialShareCardPreviewMobile({ open, onOpenChange, trade, currentPrice }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!trade || !cardRef.current) return;

    setDownloading(true);
    
    try {
      console.log('🚀 [MOBILE] Iniciando download do card com html2canvas...');
      
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1e293b',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `scalecripto-ganhos-mobile-${trade.pair.replace('/', '-')}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ [MOBILE] Download concluído com sucesso!');
        
        toast({
          title: "✅ Card Baixado!",
          description: "Imagem mobile salva com sucesso.",
          duration: 3000,
        });
        
        setDownloading(false);
        onOpenChange(false);
      });
      
    } catch (error) {
      console.error('❌ [MOBILE] Erro ao gerar card:', error);
      
      toast({
        title: "❌ Erro ao Gerar Card",
        description: error.message || "Tente novamente em alguns instantes.",
        duration: 5000,
        variant: "destructive"
      });
      
      setDownloading(false);
    }
  };

  if (!trade) return null;

  const isBuy = trade.type === "BUY";
  const leverage = trade.leverage || 1;
  const entry = trade.entry_price || 0;
  const current = currentPrice || trade.current_price || entry;
  
  let profitLossPercentage = 0;
  let profitLossUSD = 0;
  
  if (entry !== 0 && current !== 0) {
    const entryAmount = trade.entry_amount || 0;
    const totalOperatedValue = entryAmount * leverage;
    
    if (isBuy) {
      profitLossPercentage = ((current - entry) / entry) * 100;
    } else {
      profitLossPercentage = ((entry - current) / entry) * 100;
    }
    profitLossUSD = (profitLossPercentage / 100) * totalOperatedValue;
  }
  
  if (trade.status !== "ACTIVE" && trade.profit_loss_usd !== undefined) {
    profitLossUSD = trade.profit_loss_usd;
    profitLossPercentage = trade.profit_loss_percentage || profitLossPercentage;
  }
  
  const isProfit = profitLossUSD >= 0;
  const isFromAI = trade.from_ai_trader === true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-3 pt-3 pb-2 border-b border-slate-800">
          <DialogTitle className="text-xs flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-purple-400" />
            Card de Ganhos - MOBILE
          </DialogTitle>
        </DialogHeader>

        <div className="p-3">
          <div 
            ref={cardRef}
            className="relative overflow-hidden rounded-xl p-4 w-full"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
              position: 'relative'
            }}
          >
            {/* LINHAS DIAGONAIS DE FUNDO */}
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '150%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.1), transparent)',
                transform: 'rotate(-25deg)'
              }} />
              
              <div style={{
                position: 'absolute',
                top: '20%',
                right: '-30%',
                width: '180%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.08), transparent)',
                transform: 'rotate(-25deg)'
              }} />
              
              <div style={{
                position: 'absolute',
                top: '60%',
                right: '-25%',
                width: '170%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.06), transparent)',
                transform: 'rotate(-25deg)'
              }} />
              
              <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-35%',
                width: '200%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.05), transparent)',
                transform: 'rotate(-25deg)'
              }} />
            </div>

            {/* MARCA D'ÁGUA */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.015]">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/489a4f505_Art-ScaleCriptoiA-LOGO8mini.png"
                alt="Scale Logo"
                crossOrigin="anonymous"
                className="w-32 h-32 object-contain"
              />
            </div>

            {/* CONTEÚDO */}
            <div className="relative z-10 space-y-3">
              {/* HEADER - LOGO + TEXTOS ALINHADOS */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  {/* Logo */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center p-1.5 flex-shrink-0">
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/489a4f505_Art-ScaleCriptoiA-LOGO8mini.png"
                      alt="Scale Logo"
                      crossOrigin="anonymous"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Nome ScaleCripto ao lado da logo */}
                  <div className="text-sm font-black text-white leading-tight">ScaleCripto</div>
                </div>
                
                {/* Texto iA Geradora de Sinais + Estrelas */}
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[8px] text-purple-400 font-semibold">iA Geradora de Sinais</span>
                  <span className="text-[7px] text-white">★★★★★</span>
                </div>
              </div>

              {/* INFO ROW - CENTRALIZADA */}
              <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                <span className={`font-bold ${isBuy ? 'text-red-400' : 'text-emerald-400'}`}>
                  {isBuy ? 'Longa' : 'Curta'}
                </span>
                
                <div className="w-px h-3 bg-slate-600/50" />
                
                <span className="font-bold text-white">{leverage}x</span>
                
                <div className="w-px h-3 bg-slate-600/50" />
                
                <span className="font-bold text-slate-300">{trade.pair}</span>

                {isFromAI && (
                  <>
                    <div className="w-px h-3 bg-slate-600/50" />
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-[9px] font-bold text-purple-400">
                      iA Scale
                    </span>
                  </>
                )}
              </div>

              {/* P/L HORIZONTAL COM DIVISÓRIA */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className={`text-2xl font-black leading-none ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}
                    style={{
                      textShadow: isProfit ? '0 0 12px rgba(16, 185, 129, 0.6)' : '0 0 12px rgba(239, 68, 68, 0.6)'
                    }}
                  >
                    {isProfit ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                  </div>
                  
                  <div className="w-px h-6 bg-slate-600/50" />
                  
                  <div className={`text-2xl font-black leading-none ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}
                    style={{
                      textShadow: isProfit ? '0 0 12px rgba(16, 185, 129, 0.6)' : '0 0 12px rgba(239, 68, 68, 0.6)'
                    }}
                  >
                    {isProfit ? '+' : ''}{Math.abs(profitLossUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />

              {/* PREÇOS COM PONTILHADO */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Preço de Entrada</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-slate-600/50"></span>
                  <span className="text-yellow-400 font-bold">
                    {entry.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Preço Atual</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-slate-600/50"></span>
                  <span className="text-yellow-400 font-bold">
                    {current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />

              {/* FOOTER */}
              <div className="text-center">
                <div className="text-[7px] text-slate-400 mb-0.5">Powered by</div>
                <div className="text-[10px] text-purple-400 font-black tracking-wide">
                  ScaleCripto.com
                </div>
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-[9px] text-center mt-2">
            Clique em "Baixar" para salvar o card
          </p>
        </div>

        <DialogFooter className="px-3 pb-3 pt-2 border-t border-slate-800 flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white h-9 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Fechar
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white h-9 font-bold text-xs"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                Baixando...
              </>
            ) : (
              <>
                <Download className="w-3 h-3 mr-1" />
                Baixar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}