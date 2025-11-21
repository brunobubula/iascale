import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";

export default function SocialShareCardPreview({ open, onOpenChange, trade, currentPrice }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!trade || !cardRef.current) return;

    setDownloading(true);
    
    try {
      console.log('🚀 [DESKTOP] Iniciando download do card com html2canvas...');
      
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f172a',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `scalecripto-ganhos-${trade.pair.replace('/', '-')}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ [DESKTOP] Download concluído com sucesso!');
        
        toast({
          title: "✅ Card Baixado!",
          description: "Imagem salva com sucesso.",
          duration: 3000,
        });
        
        setDownloading(false);
        onOpenChange(false);
      });
      
    } catch (error) {
      console.error('❌ [DESKTOP] Erro ao gerar card:', error);
      
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
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[600px] max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Download className="w-6 h-6 text-purple-400" />
            Card de Ganhos - DESKTOP
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div 
            ref={cardRef}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
              padding: '48px',
              width: '100%',
              aspectRatio: '16/9'
            }}
          >
            {/* FORMAS GEOMÉTRICAS SUTIS DE FUNDO */}
            <div style={{ position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' }}>
              <div 
                style={{
                  position: 'absolute',
                  right: '-80px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(45deg)',
                  width: '300px',
                  height: '300px',
                  background: isProfit 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, transparent 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, transparent 100%)',
                  border: `1px solid ${isProfit ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'}`
                }}
              />

              <div 
                style={{
                  position: 'absolute',
                  left: '-40px',
                  top: '20%',
                  transform: 'rotate(45deg)',
                  width: '200px',
                  height: '200px',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.02) 0%, transparent 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.06)'
                }}
              />

              <div 
                style={{
                  position: 'absolute',
                  right: '60px',
                  top: '-50px',
                  width: '0',
                  height: '0',
                  borderLeft: '100px solid transparent',
                  borderRight: '100px solid transparent',
                  borderBottom: `150px solid ${isProfit ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'}`,
                  transform: 'rotate(30deg)'
                }}
              />

              {/* MARCA D'ÁGUA - LOGO BRANCA COM OBJECT-FIT FORÇADO */}
              <div 
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '400px',
                  height: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backfaceVisibility: 'hidden'
                }}
              >
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/489a4f505_Art-ScaleCriptoiA-LOGO8mini.png"
                  alt="Scale Logo"
                  crossOrigin="anonymous"
                  style={{ 
                    width: '400px', 
                    height: '400px',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    opacity: '0.015',
                    imageRendering: 'auto',
                    backfaceVisibility: 'hidden',
                    transformStyle: 'preserve-3d'
                  }}
                />
              </div>
            </div>

            {/* HEADER - LOGO ROXA + BRANDING COM ESTRELAS */}
            <div style={{ position: 'relative', zIndex: '10', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* LOGO BOX COM OBJECT-FIT ULTRA FORÇADO */}
                <div 
                  style={{
                    width: '56px',
                    height: '56px',
                    minWidth: '56px',
                    minHeight: '56px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '8px',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/489a4f505_Art-ScaleCriptoiA-LOGO8mini.png"
                    alt="Scale Logo"
                    crossOrigin="anonymous"
                    style={{
                      width: '100%',
                      height: '100%',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center center',
                      imageRendering: 'auto',
                      backfaceVisibility: 'hidden',
                      transformStyle: 'preserve-3d'
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>ScaleCripto</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#a855f7', fontWeight: '600' }}>iA Geradora de Sinais</div>
                    <div style={{ color: '#ffffff', fontSize: '11px', letterSpacing: '1px' }}>★★★★★</div>
                  </div>
                </div>
              </div>
            </div>

            {/* INFO ROW */}
            <div style={{ position: 'relative', zIndex: '10', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '12px' }}>
              <div>
                <div 
                  style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: isBuy ? '#10b981' : '#ef4444'
                  }}
                >
                  {isBuy ? 'Longa' : 'Curta'}
                </div>
              </div>
              
              <div style={{ width: '1px', height: '24px', background: 'rgba(148, 163, 184, 0.3)' }} />
              
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                  {leverage}x
                </div>
              </div>
              
              <div style={{ width: '1px', height: '24px', background: 'rgba(148, 163, 184, 0.3)' }} />
              
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#cbd5e1' }}>
                  {trade.pair}
                </div>
              </div>

              {isFromAI && (
                <>
                  <div style={{ width: '1px', height: '24px', background: 'rgba(148, 163, 184, 0.3)' }} />
                  {/* ELEMENTO "iA Scale" - ULTRA FIXADO COM FORÇA TAREFA */}
                  <div 
                    style={{
                      position: 'relative',
                      top: '0px',
                      left: '0px',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      display: 'inline-block',
                      transform: 'rotate(0deg) translateZ(0)',
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                      willChange: 'auto'
                    }}
                  >
                    <span 
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#a855f7',
                        lineHeight: '1',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        transform: 'rotate(0deg)',
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      iA Scale
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* P/L DESTAQUE COM USD - LADO A LADO */}
            <div style={{ position: 'relative', zIndex: '10', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div 
                style={{ 
                  fontSize: '38px',
                  lineHeight: '1',
                  fontWeight: '900',
                  color: isProfit ? '#10b981' : '#ef4444',
                  textShadow: isProfit 
                    ? '0 0 20px rgba(16, 185, 129, 0.5)'
                    : '0 0 20px rgba(239, 68, 68, 0.5)',
                  letterSpacing: '-1.5px'
                }}
              >
                {isProfit ? '+' : ''}{profitLossPercentage.toFixed(2)}%
              </div>

              <div style={{ width: '1px', height: '40px', background: 'rgba(148, 163, 184, 0.3)' }} />

              <div 
                style={{ 
                  fontSize: '38px',
                  lineHeight: '1',
                  fontWeight: '900',
                  color: isProfit ? '#10b981' : '#ef4444',
                  textShadow: isProfit 
                    ? '0 0 20px rgba(16, 185, 129, 0.5)'
                    : '0 0 20px rgba(239, 68, 68, 0.5)',
                  letterSpacing: '-1.5px'
                }}
              >
                {isProfit ? '+' : ''}{Math.abs(profitLossUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* PREÇOS */}
            <div style={{ position: 'relative', zIndex: '10', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500', width: '128px' }}>Preço de Entrada</div>
                <div style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                  {entry.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500', width: '128px' }}>Preço Atual</div>
                <div style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                  {current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ position: 'absolute', bottom: '32px', right: '48px', zIndex: '10' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Powered by</div>
                <div style={{ color: '#a855f7', fontSize: '14px', fontWeight: '900', letterSpacing: '0.5px' }}>ScaleCripto.com</div>
              </div>
            </div>
          </div>

          {/* INFO DO CARD */}
          <div className="mt-4 text-center">
            <p className="text-slate-400 text-xs">
              Preview do card DESKTOP - Clique em "Baixar Card" para salvar a imagem
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-3 gap-2 border-t border-slate-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white h-11"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white h-11 font-bold"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Gerando Card...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Baixar Card
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}