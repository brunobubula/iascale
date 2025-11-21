import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function usePairChange24h(pair) {
  return useQuery({
    queryKey: ['pairChange24h', pair],
    queryFn: async () => {
      if (!pair) return null;

      try {
        // Extrai o símbolo base (ex: BTC de BTC/USDT)
        const [base] = pair.split('/');
        
        // Busca dados do CoinGecko
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Busque o preço atual e a variação de 24h (em percentual) para a criptomoeda ${base}.
          
Retorne apenas o JSON com os dados mais recentes disponíveis.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              price: { type: "number" },
              change_24h: { type: "number" }
            },
            required: ["price", "change_24h"]
          }
        });

        return {
          change24h: response.change_24h || 0,
          price: response.price || 0
        };
      } catch (error) {
        console.error('Erro ao buscar variação 24h:', error);
        return { change24h: 0, price: 0 };
      }
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    retry: 1,
    enabled: !!pair
  });
}