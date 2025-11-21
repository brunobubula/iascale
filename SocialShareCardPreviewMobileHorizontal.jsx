import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";

export default function SocialShareCardPreviewMobileHorizontal({ open, onOpenChange, trade, currentPrice }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!trade || !cardRef.current) return;

    setDownloading(true);
    
    try {
      console.log('🚀 [MOBILE HORIZONTAL] Iniciando download do card com html2canvas...');
      
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `scalecripto-ganhos-mobile-h-${trade.pair.replace('/', '-')}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ [MOBILE HORIZONTAL] Download concluído com sucesso!');
        
        toast({
          title: "✅ Card Baixado!",
          description: "Imagem mobile horizontal salva com sucesso.",
          duration: 3000,
        });
        
        setDownloading(false);
        onOpenChange(false);
      });
      
    } catch (error) {
      console.error('❌ [MOBILE HORIZONTAL] Erro ao gerar card:', error);
      
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
  const entryAmount = trade.entry_amount || 0;
  const totalOperatedValue = entryAmount * leverage;
  const entry = trade.entry_price || 0;
  const current = currentPrice || trade.current_price || entry;
  
  let profitLossPercentage = 0;
  let profitLossUSD = 0;
  
  if (entry !== 0 && current !== 0) {
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
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Download className="w-4 h-4 text-purple-400" />
            Card de Ganhos - MOBILE HORIZONTAL
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4">
          <div 
            ref={cardRef}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
              padding: '24px',
              width: '100%',
              aspectRatio: '16/9'
            }}
          >
            {/* MARCA D'ÁGUA */}
            <div style={{ position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/489a4f505_Art-ScaleCriptoiA-LOGO8mini.png"
                alt="Scale Logo"
                crossOrigin="anonymous"
                style={{ 
                  width: '200px',
                  height: '200px',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  opacity: '0.015'
                }}
              />
            </div>

            {/* HEADER - COMPACTO */}
            <div style={{ position: 'relative', zIndex: '10', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div 
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '6px'
                  }}
                >
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/489a4f505_Art-ScaleCriptoiA-LOGO8mini.png"
                    alt="Scale Logo"
                    crossOrigin="anonymous"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#ffffff' }}>ScaleCripto</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#a855f7', fontWeight: '600' }}>iA Geradora de Sinais</span>
                    <span style={{ color: '#ffffff', fontSize: '8px' }}>★★★★★</span>
                  </div>
                </div>
              </div>
            </div>

            {/* INFO ROW */}
            <div style={{ position: 'relative', zIndex: '10', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: isBuy ? '#10b981' : '#ef4444' }}>
                {isBuy ? 'Longa' : 'Curta'}
              </div>
              
              <div style={{ width: '1px', height: '16px', background: 'rgba(148, 163, 184, 0.3)' }} />
              
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>
                {leverage}x
              </div>
              
              <div style={{ width: '1px', height: '16px', background: 'rgba(148, 163, 184, 0.3)' }} />
              
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#cbd5e1' }}>
                {trade.pair}
              </div>

              {isFromAI && (
                <>
                  <div style={{ width: '1px', height: '16px', background: 'rgba(148, 163, 184, 0.3)' }} />
                  <div 
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#a855f7'
                    }}
                  >
                    iA Scale
                  </div>
                </>
              )}
            </div>

            {/* P/L LADO A LADO */}
            <div style={{ position: 'relative', zIndex: '10', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                style={{ 
                  fontSize: '28px',
                  lineHeight: '1',
                  fontWeight: '900',
                  color: isProfit ? '#10b981' : '#ef4444',
                  textShadow: isProfit 
                    ? '0 0 16px rgba(16, 185, 129, 0.5)'
                    : '0 0 16px rgba(239, 68, 68, 0.5)',
                  letterSpacing: '-1px'
                }}
              >
                {isProfit ? '+' : ''}{profitLossPercentage.toFixed(2)}%
              </div>

              <div style={{ width: '1px', height: '32px', background: 'rgba(148, 163, 184, 0.3)' }} />

              <div 
                style={{ 
                  fontSize: '28px',
                  lineHeight: '1',
                  fontWeight: '900',
                  color: isProfit ? '#10b981' : '#ef4444',
                  textShadow: isProfit 
                    ? '0 0 16px rgba(16, 185, 129, 0.5)'
                    : '0 0 16px rgba(239, 68, 68, 0.5)',
                  letterSpacing: '-1px'
                }}
              >
                {isProfit ? '+' : ''}{Math.abs(profitLossUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* PREÇOS */}
            <div style={{ position: 'relative', zIndex: '10', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500', width: '90px' }}>Entrada</span>
                <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '700' }}>
                  {entry.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500', width: '90px' }}>Atual</span>
                <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '700' }}>
                  {current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ position: 'absolute', bottom: '16px', right: '24px', zIndex: '10', textAlign: 'right' }}>
              <div style={{ color: '#94a3b8', fontSize: '9px', marginBottom: '2px' }}>Powered by</div>
              <div style={{ color: '#a855f7', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }}>ScaleCripto.com</div>
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className="text-slate-400 text-xs">
              Preview do card MOBILE HORIZONTAL - Clique em "Baixar" para salvar
            </p>
          </div>
        </div>

        <DialogFooter className="px-4 pb-4 pt-2 gap-2 border-t border-slate-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white h-9 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Cancelar
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white h-9 font-bold text-xs"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-3 h-3 mr-1" />
                Baixar Card
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}