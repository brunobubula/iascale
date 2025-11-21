import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AccountProfitShareCard({ open, onOpenChange, openPLData, user, activeTrades }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { toast } = useToast();

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownload = async () => {
    if (!openPLData || !cardRef.current) return;

    setDownloading(true);
    
    try {
      console.log('🚀 Iniciando download do card de lucro...');
      
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f172a',
        scale: isMobile ? 2 : 3,
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `scalecripto-lucro-total-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ Download concluído com sucesso!');
        
        toast({
          title: "✅ Card Baixado!",
          description: "Imagem salva com sucesso.",
          duration: 3000,
        });
        
        setDownloading(false);
        onOpenChange(false);
      });
      
    } catch (error) {
      console.error('❌ Erro ao gerar card:', error);
      
      toast({
        title: "❌ Erro ao Gerar Card",
        description: error.message || "Tente novamente em alguns instantes.",
        duration: 5000,
        variant: "destructive"
      });
      
      setDownloading(false);
    }
  };

  if (!openPLData) return null;

  const isProfit = openPLData.totalPLUSD >= 0;
  const initialBalance = user?.initial_balance || 0;
  const profitabilityPercent = initialBalance > 0 
    ? (openPLData.totalPLUSD / initialBalance) * 100 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`bg-slate-900 border-slate-800 text-white p-0 gap-0 ${
        isMobile ? 'max-w-[95vw]' : 'max-w-[600px]'
      } max-h-[95vh] overflow-hidden`}>
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-slate-800">
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Download className="w-4 h-4 text-purple-400" />
            {isMobile ? "Lucro Total - MOBILE" : "Lucro Total - DESKTOP"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          {isMobile ? (
            // VERSÃO MOBILE
            <div 
              ref={cardRef}
              className="relative overflow-hidden rounded-xl p-4 w-full"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
                position: 'relative'
              }}
            >
              {/* LINHAS DIAGONAIS DE FUNDO */}
              <div style={{ position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' }}>
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
                {/* HEADER */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center p-1.5 flex-shrink-0">
                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/489a4f505_Art-ScaleCriptoiA-LOGO8mini.png"
                        alt="Scale Logo"
                        crossOrigin="anonymous"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-sm font-black text-white leading-tight">ScaleCripto</div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[8px] text-purple-400 font-semibold">iA Geradora de Sinais</span>
                    <span className="text-[7px] text-white">★★★★★</span>
                  </div>
                </div>

                {/* LUCRO TOTAL */}
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 mb-1">Lucro Total Aberto</div>
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className={`text-2xl font-black leading-none ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}
                      style={{
                        textShadow: isProfit ? '0 0 12px rgba(16, 185, 129, 0.6)' : '0 0 12px rgba(239, 68, 68, 0.6)'
                      }}
                    >
                      {isProfit ? '+' : ''}{Math.abs(openPLData.totalPLUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* DIVIDER */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />

                {/* ESTATÍSTICAS */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Média P/L</span>
                    <span className="flex-1 mx-2 border-b border-dotted border-slate-600/50"></span>
                    <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isProfit ? '+' : ''}{openPLData.avgPercentage.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Posições Abertas</span>
                    <span className="flex-1 mx-2 border-b border-dotted border-slate-600/50"></span>
                    <span className="text-white font-bold">
                      {activeTrades.length}
                    </span>
                  </div>

                  {initialBalance > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Rentabilidade</span>
                      <span className="flex-1 mx-2 border-b border-dotted border-slate-600/50"></span>
                      <span className={`font-bold ${profitabilityPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {profitabilityPercent >= 0 ? '+' : ''}{profitabilityPercent.toFixed(2)}%
                      </span>
                    </div>
                  )}
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
          ) : (
            // VERSÃO DESKTOP
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
              {/* FORMAS GEOMÉTRICAS DE FUNDO */}
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

                {/* MARCA D'ÁGUA */}
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

              {/* HEADER */}
              <div style={{ position: 'relative', zIndex: '10', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

              {/* LUCRO TOTAL */}
              <div style={{ position: 'relative', zIndex: '10', marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Lucro Total Aberto</div>
                <div 
                  style={{ 
                    fontSize: '48px',
                    lineHeight: '1',
                    fontWeight: '900',
                    color: isProfit ? '#10b981' : '#ef4444',
                    textShadow: isProfit 
                      ? '0 0 20px rgba(16, 185, 129, 0.5)'
                      : '0 0 20px rgba(239, 68, 68, 0.5)',
                    letterSpacing: '-1.5px'
                    }}
                    >
                    {isProfit ? '+' : ''}{Math.abs(openPLData.totalPLUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* ESTATÍSTICAS */}
              <div style={{ position: 'relative', zIndex: '10', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', width: '160px' }}>Média P/L</div>
                  <div style={{ color: isProfit ? '#10b981' : '#ef4444', fontSize: '16px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                    {isProfit ? '+' : ''}{openPLData.avgPercentage.toFixed(2)}%
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', width: '160px' }}>Posições Abertas</div>
                  <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                    {activeTrades.length}
                  </div>
                </div>

                {initialBalance > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', width: '160px' }}>Rentabilidade Total</div>
                    <div style={{ color: profitabilityPercent >= 0 ? '#10b981' : '#ef4444', fontSize: '16px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                      {profitabilityPercent >= 0 ? '+' : ''}{profitabilityPercent.toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div style={{ position: 'absolute', bottom: '32px', right: '48px', zIndex: '10' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Powered by</div>
                  <div style={{ color: '#a855f7', fontSize: '14px', fontWeight: '900', letterSpacing: '0.5px' }}>ScaleCripto.com</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 text-center">
            <p className="text-slate-400 text-xs">
              Preview do card - Clique em "Baixar Card" para salvar a imagem
            </p>
          </div>
        </div>

        <DialogFooter className="px-4 pb-4 pt-2 border-t border-slate-800 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white h-10"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white h-10 font-bold"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Baixar Card
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}