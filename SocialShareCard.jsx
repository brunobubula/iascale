import React from "react";

export default function SocialShareCard({ trade, currentPrice }) {
  if (!trade) return null;

  const isBuy = trade.type === "BUY";
  const leverage = trade.leverage || 1;
  const entryAmount = trade.entry_amount || 0;
  const totalOperatedValue = entryAmount * leverage;
  const entry = trade.entry_price || 0;
  const current = currentPrice || trade.current_price || entry;
  
  let profitLoss = 0;
  if (entry !== 0) {
    if (isBuy) {
      profitLoss = ((current - entry) / entry) * 100;
    } else {
      profitLoss = ((entry - current) / entry) * 100;
    }
  }
  
  const profitLossUSD = trade.profit_loss_usd !== undefined 
    ? trade.profit_loss_usd 
    : ((profitLoss / 100) * totalOperatedValue);
  const isProfit = profitLossUSD >= 0;
  const isFromAI = trade.from_ai_trader === true;

  const mainColor = isProfit ? '#10b981' : '#ef4444';
  const mainColorLight = isProfit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
  const mainColorBorder = isProfit ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)';

  return (
    <div style={{ 
      width: '1080px', 
      height: '1080px', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Background Layers */}
      <div style={{ position: 'absolute', inset: '0', overflow: 'hidden' }}>
        {/* Logo Watermark */}
        <div style={{ 
          position: 'absolute', 
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: '0.04',
          width: '800px',
          height: '800px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="800" height="800" viewBox="0 0 800 800">
            <circle cx="400" cy="400" r="350" fill={mainColorLight} opacity="0.3"/>
            <text x="400" y="420" textAnchor="middle" fontSize="180" fontWeight="900" fill="#ffffff" opacity="0.15">₿</text>
          </svg>
        </div>

        {/* Floating Emojis */}
        <div style={{ position: 'absolute', top: '100px', left: '80px', fontSize: '60px', opacity: '0.08' }}>🚀</div>
        <div style={{ position: 'absolute', top: '200px', right: '100px', fontSize: '70px', opacity: '0.08' }}>💰</div>
        <div style={{ position: 'absolute', bottom: '150px', left: '120px', fontSize: '65px', opacity: '0.08' }}>📈</div>
        <div style={{ position: 'absolute', bottom: '200px', right: '90px', fontSize: '75px', opacity: '0.08' }}>💸</div>
        <div style={{ position: 'absolute', top: '300px', left: '50px', fontSize: '55px', opacity: '0.06' }}>⚡</div>
        <div style={{ position: 'absolute', top: '400px', right: '70px', fontSize: '60px', opacity: '0.06' }}>💎</div>
        <div style={{ position: 'absolute', bottom: '400px', left: '200px', fontSize: '50px', opacity: '0.05' }}>🎯</div>
        <div style={{ position: 'absolute', bottom: '300px', right: '150px', fontSize: '55px', opacity: '0.05' }}>🔥</div>

        {/* Gradient Orbs */}
        <div style={{ 
          position: 'absolute', 
          top: '-100px', 
          left: '-100px', 
          width: '450px', 
          height: '450px', 
          background: mainColorLight,
          borderRadius: '50%',
          filter: 'blur(100px)',
          opacity: '0.4'
        }}></div>
        <div style={{ 
          position: 'absolute', 
          bottom: '-150px', 
          right: '-150px', 
          width: '500px', 
          height: '500px', 
          background: 'rgba(168, 85, 247, 0.15)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          opacity: '0.3'
        }}></div>
      </div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: '10', height: '100%', display: 'flex', flexDirection: 'column', padding: '60px' }}>
        {/* Header: Logo + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '50px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            background: 'linear-gradient(135deg, #10b981, #14b8a6)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4)',
            fontSize: '50px'
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#ffffff', lineHeight: '1.1', marginBottom: '6px' }}>
              ScaleCripto
            </div>
            <div style={{ fontSize: '26px', color: '#10b981', fontWeight: '700', letterSpacing: '1px' }}>
              iA GERADORA DE SINAIS
            </div>
          </div>
        </div>

        {/* Main Result - DESTAQUE MÁXIMO */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            background: `linear-gradient(135deg, ${mainColorLight}, ${mainColorLight})`,
            border: `8px solid ${mainColorBorder}`,
            borderRadius: '50px',
            padding: '60px 80px',
            boxShadow: `0 0 100px ${isProfit ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            marginBottom: '50px',
            textAlign: 'center',
            minWidth: '700px'
          }}>
            <div style={{ color: '#cbd5e1', fontSize: '28px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '3px' }}>
              LUCRO / PERDA
            </div>
            
            {/* USD Value - GIGANTE */}
            <div style={{ 
              fontSize: '140px', 
              fontWeight: '900', 
              lineHeight: '1',
              color: mainColor,
              marginBottom: '25px',
              textShadow: `0 0 50px ${isProfit ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'}`,
              letterSpacing: '-2px'
            }}>
              {isProfit ? '+' : ''}{Math.abs(profitLossUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            
            {/* Percentage */}
            <div style={{ 
              fontSize: '80px', 
              fontWeight: '900',
              color: mainColor,
              letterSpacing: '-1px'
            }}>
              {isProfit ? '+' : ''}{profitLoss.toFixed(2)}%
            </div>
          </div>

          {/* Pair + Type + Source */}
          <div style={{ textAlign: 'center', width: '100%', marginBottom: '40px' }}>
            <div style={{ fontSize: '72px', fontWeight: '900', color: '#ffffff', marginBottom: '30px', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              {trade.pair}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
              {/* Type */}
              <div style={{
                padding: '18px 40px',
                borderRadius: '24px',
                background: isBuy ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                border: `4px solid ${isBuy ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'}`,
                boxShadow: isBuy ? '0 8px 32px rgba(16, 185, 129, 0.3)' : '0 8px 32px rgba(239, 68, 68, 0.3)'
              }}>
                <span style={{ fontSize: '44px', fontWeight: '900', color: isBuy ? '#10b981' : '#ef4444' }}>
                  {isBuy ? '▲ COMPRA' : '▼ VENDA'}
                </span>
              </div>

              {/* Source */}
              <div style={{
                padding: '18px 40px',
                borderRadius: '24px',
                background: isFromAI ? 'rgba(168, 85, 247, 0.25)' : 'rgba(71, 85, 105, 0.3)',
                border: `4px solid ${isFromAI ? 'rgba(168, 85, 247, 0.6)' : 'rgba(100, 116, 139, 0.6)'}`,
                boxShadow: isFromAI ? '0 8px 32px rgba(168, 85, 247, 0.3)' : '0 8px 32px rgba(100, 116, 139, 0.2)'
              }}>
                <span style={{ fontSize: '40px', fontWeight: '900', color: isFromAI ? '#a855f7' : '#94a3b8' }}>
                  {isFromAI ? '✨ iA Scale' : '✍️ Manual'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Prices */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '35px' }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '28px',
            padding: '35px',
            border: '3px solid rgba(71, 85, 105, 0.6)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ color: '#94a3b8', fontSize: '24px', marginBottom: '15px', fontWeight: '600' }}>
              Preço de Entrada
            </div>
            <div style={{ color: '#ffffff', fontSize: '52px', fontWeight: '900', letterSpacing: '-1px' }}>
              {entry.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '28px',
            padding: '35px',
            border: '3px solid rgba(71, 85, 105, 0.6)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ color: '#94a3b8', fontSize: '24px', marginBottom: '15px', fontWeight: '600' }}>
              Preço Atual
            </div>
            <div style={{ color: '#ffffff', fontSize: '52px', fontWeight: '900', letterSpacing: '-1px' }}>
              {current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Bottom Brand */}
        <div style={{ textAlign: 'center', marginTop: '35px', paddingTop: '25px', borderTop: '2px solid rgba(71, 85, 105, 0.3)' }}>
          <div style={{ color: '#64748b', fontSize: '26px', fontWeight: '700', letterSpacing: '1px' }}>
            ScaleCripto.com
          </div>
        </div>
      </div>
    </div>
  );
}