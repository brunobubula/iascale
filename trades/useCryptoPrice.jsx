import { useState, useEffect, useRef } from "react";

export function useCryptoPrice(pairs) {
  const [prices, setPrices] = useState({});
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!pairs || !Array.isArray(pairs) || pairs.length === 0) {
      return;
    }

    const validPairs = pairs.filter(pair => pair && typeof pair === 'string');
    if (validPairs.length === 0) return;

    const binancePairs = validPairs.map(pair => {
      return pair.replace('/', '').toLowerCase();
    });

    const streams = binancePairs.map(pair => `${pair}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    const connect = () => {
      if (!isMountedRef.current) return;
      
      try {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          return;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          
          try {
            const data = JSON.parse(event.data);
            if (data.data) {
              const symbol = data.data.s;
              const price = parseFloat(data.data.c);
              const high = parseFloat(data.data.h);
              const low = parseFloat(data.data.l);
              const priceChange = parseFloat(data.data.p);
              const priceChangePercent = parseFloat(data.data.P);
              
              const formattedSymbol = symbol.replace('USDT', '/USDT').replace('USDC', '/USDC');
              
              setPrices(prev => ({
                ...prev,
                [formattedSymbol]: { 
                  price, 
                  high, 
                  low,
                  change24h: priceChangePercent,
                  change24hUSD: priceChange
                }
              }));
            }
          } catch (error) {
            console.error('Erro ao processar mensagem WebSocket:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('Erro no WebSocket:', error);
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          
          reconnectAttemptsRef.current++;
          
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, delay);
        };
      } catch (error) {
        console.error('Erro ao conectar WebSocket:', error);
      }
    };

    connect();

    return () => {
      isMountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [JSON.stringify(pairs)]);

  return prices;
}

export function useSingleCryptoPrice(pair) {
  const validPair = pair && typeof pair === 'string' ? pair : null;
  const prices = useCryptoPrice(validPair ? [validPair] : []);
  return validPair ? (prices[validPair] || null) : null;
}