import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Target, AlertTriangle, XCircle, Edit2, Sparkles, Share2, Download, Send, Check, Rocket, CheckCircle, GraduationCap, DollarSign, BookOpen, Bell, Trash2, Star, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useSingleCryptoPrice } from "./useCryptoPrice";
import { format as formatDate } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import UpgradeInfinityPRODialog from "../../pages/UpgradeInfinityPRO";
import SocialShareCardPreview from "../SocialShareCardPreview";
import SocialShareCardPreviewMobile from "../SocialShareCardPreviewMobile";
import { useToast } from "@/components/ui/use-toast";
import { hasInfinityProAccess } from "../AccessControl";
import PublishStudyDialog from "../admin/PublishStudyDialog";

const ALERT_SOUNDS = [
  { value: "bell", label: "🔔 Sino Clássico" },
  { value: "chime", label: "🎵 Chime Suave" },
  { value: "beep", label: "📢 Beep Eletrônico" },
  { value: "ding", label: "🔊 Ding" },
  { value: "alert", label: "⚠️ Alerta Urgente" },
  { value: "notification", label: "📬 Notificação" },
  { value: "success", label: "✅ Sucesso" },
  { value: "warning", label: "⚡ Aviso" },
  { value: "coin", label: "💰 Moeda" },
  { value: "cash", label: "💵 Dinheiro" },
];

// Sistema de fallback de logos idêntico ao UnifiedPairSelector
const getAssetLogos = (baseAsset) => {
  const cleanAsset = baseAsset.replace(/\s+/g, '').toUpperCase();
  const symbol = cleanAsset.toLowerCase();

  return [
    `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol}.png`,
    `https://cryptoicons.org/api/icon/${symbol}/128`,
    `https://www.coinlore.com/img/${symbol}.png`,
  ];
};

// Componente para renderizar logo com fallback
function CoinLogo({ pair, className = "w-6 h-6" }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const baseAsset = pair.split('/')[0];
  const logoUrls = getAssetLogos(baseAsset);

  const handleImageError = () => {
    if (imageIndex < logoUrls.length - 1) {
      setImageIndex(imageIndex + 1);
    } else {
      setAllFailed(true);
    }
  };

  if (allFailed) {
    return (
      <div className={`${className} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center`}>
        <span className="text-white text-[10px] font-bold">{baseAsset[0]}</span>
      </div>
    );
  }

  return (
    <img
      key={imageIndex}
      src={logoUrls[imageIndex]}
      alt={baseAsset}
      className={`${className} rounded-full object-cover bg-slate-800`}
      onError={handleImageError}
      loading="eager"
    />
  );
}

export default function TradeCard({ trade, onUpdate, isHighlighted, hideBalances, onCardClick }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showEditAlertDialog, setShowEditAlertDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showEditNotesDialog, setShowEditNotesDialog] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingAINotes, setGeneratingAINotes] = useState(false);
  const [generatingEditAINotes, setGeneratingEditAINotes] = useState(false);
  const [selectedAlertForEdit, setSelectedAlertForEdit] = useState(null);
  const [editNotesForm, setEditNotesForm] = useState("");
  const [showSocialPreview, setShowSocialPreview] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPublishStudyDialog, setShowPublishStudyDialog] = useState(false);

  const shareCardRef = useRef(null);
  const { toast } = useToast();

  // Detectar mudança de tamanho da tela
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [editForm, setEditForm] = useState({
    take_profit: trade.take_profit || 0,
    stop_loss: trade.stop_loss || 0,
    notes: trade.notes || ""
  });

  const [alertForm, setAlertForm] = useState({
    name: "",
    condition_type: "pl_usd",
    condition_value: "",
    sound: "bell"
  });

  const [editAlertForm, setEditAlertForm] = useState({
    name: "",
    condition_type: "pl_usd",
    condition_value: "",
    sound: "bell"
  });

  const formatPrice = (price) => {
    if (price == null || isNaN(price)) return '0.00';
    const numPrice = parseFloat(price);
    if (numPrice === 0) return '0.00';
    if (Math.abs(numPrice) < 1) {
      const decimalPart = numPrice.toString().split('.')[1];
      if (decimalPart) {
        const leadingZeros = (decimalPart.match(/^0*/) || [''])[0].length;
        return numPrice.toFixed(Math.min(8, leadingZeros + 2));
      }
      return numPrice.toFixed(2);
    }
    return numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: favoritePairs = [] } = useQuery({
    queryKey: ['favoritePairs'],
    queryFn: () => base44.entities.FavoritePair.list(),
    initialData: []
  });

  const { data: tradeAlerts = [] } = useQuery({
    queryKey: ['tradeAlerts', trade.id],
    queryFn: async () => {
      const allAlerts = await base44.entities.TradeAlert.list();
      return allAlerts.filter((a) => a.trade_id === trade.id && a.is_active && !a.triggered_at);
    },
    initialData: [],
    refetchInterval: 5000
  });

  const hasActiveAlerts = tradeAlerts.length > 0;
  const isFavorite = favoritePairs.some((fp) => fp.pair === trade.pair);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const existing = favoritePairs.find((fp) => fp.pair === trade.pair);
      if (existing) {
        await base44.entities.FavoritePair.delete(existing.id);
      } else {
        await base44.entities.FavoritePair.create({ pair: trade.pair });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritePairs'] });
    }
  });

  const handleStarClick = (e) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate();
  };

  // USAR FUNÇÃO CENTRALIZADA DE CONTROLE DE ACESSO
  const isInfinityPro = hasInfinityProAccess(user);

  const tradeOpenTime = React.useMemo(() => {
    if (!trade.created_date) return "";
    const tradeDate = new Date(trade.created_date);
    const brazilTime = new Date(tradeDate.getTime() - 3 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = now - brazilTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "agora";
    } else if (diffMinutes < 60) {
      return `há ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `há ${diffHours}h`;
    } else {
      return `há ${diffDays}d`;
    }
  }, [trade.created_date]);

  const isBuy = trade.type === "BUY";
  const entryAmount = trade.entry_amount || 0;
  const leverage = trade.leverage || 1;
  const totalOperatedValue = entryAmount * leverage;
  const isActive = trade.status === "ACTIVE";

  const realtimePriceData = useSingleCryptoPrice(trade.pair);
  const realtimePrice = realtimePriceData?.price;
  const calculatedCurrentPrice = isActive ? realtimePrice || trade.current_price || trade.entry_price || 0 : trade.current_price || trade.entry_price || 0;

  const calculateProfitLoss = () => {
    const entry = trade.entry_price || 0;
    const current = calculatedCurrentPrice || 0;

    if (entry === 0) return 0;

    if (isBuy) {
      return (current - entry) / entry * 100;
    } else {
      return (entry - current) / entry * 100;
    }
  };

  const profitLoss = calculateProfitLoss();
  const profitLossUSD = profitLoss / 100 * totalOperatedValue;
  const isProfit = profitLoss >= 0;

  const closePositionMutation = useMutation({
    mutationFn: async () => {
      const finalProfitLoss = isBuy ?
        (calculatedCurrentPrice - trade.entry_price) / trade.entry_price * 100 :
        (trade.entry_price - calculatedCurrentPrice) / trade.entry_price * 100;

      const finalProfitLossUSD = finalProfitLoss / 100 * totalOperatedValue;

      // Criar backup completo antes de fechar
      const backup = {
        ...trade,
        final_price: calculatedCurrentPrice,
        final_pl_percentage: finalProfitLoss,
        final_pl_usd: finalProfitLossUSD,
        closed_timestamp: new Date().toISOString()
      };

      const updateData = {
        status: "CLOSED",
        current_price: calculatedCurrentPrice,
        profit_loss_percentage: finalProfitLoss,
        profit_loss_usd: finalProfitLossUSD,
        backup_before_close: backup,
        closed_at: new Date().toISOString()
      };

      return await base44.entities.TradeSignal.update(trade.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      if (onUpdate) onUpdate();
      toast({
        title: "✅ Sucesso!",
        description: "Trade fechado com sucesso.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: `Erro ao fechar trade: ${error.message || 'Erro desconhecido'}`,
        duration: 3000,
        variant: "destructive"
      });
    }
  });

  const editTradeMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.TradeSignal.update(trade.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      setShowEditDialog(false);
      if (onUpdate) onUpdate();
      toast({
        title: "✅ Sucesso!",
        description: "Trade editado com sucesso.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: `Erro ao editar trade: ${error.message || 'Erro desconhecido'}`,
        duration: 3000,
        variant: "destructive"
      });
    }
  });

  const updateNotesMutation = useMutation({
    mutationFn: async (notes) => {
      return await base44.entities.TradeSignal.update(trade.id, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      setShowEditNotesDialog(false);
      if (onUpdate) onUpdate();
      toast({
        title: "✅ Sucesso!",
        description: "Observação atualizada com sucesso.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: `Erro ao atualizar observação: ${error.message || 'Erro desconhecido'}`,
        duration: 3000,
        variant: "destructive"
      });
    }
  });

  const createAlertMutation = useMutation({
    mutationFn: async (alertData) => {
      return await base44.entities.TradeAlert.create({
        ...alertData,
        trade_id: trade.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['tradeAlerts', trade.id] });
      setShowAlertDialog(false);
      setAlertForm({
        name: "",
        condition_type: "pl_usd",
        condition_value: "",
        sound: "bell"
      });
      toast({
        title: "✅ Sucesso!",
        description: "Alerta criado com sucesso.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: `Erro ao criar alerta: ${error.message || 'Erro desconhecido'}`,
        duration: 3000,
        variant: "destructive"
      });
    }
  });

  const updateAlertMutation = useMutation({
    mutationFn: async ({ alertId, alertData }) => {
      return await base44.entities.TradeAlert.update(alertId, alertData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['tradeAlerts', trade.id] });
      setShowEditAlertDialog(false);
      setSelectedAlertForEdit(null);
      toast({
        title: "✅ Sucesso!",
        description: "Alerta atualizado com sucesso.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: `Erro ao atualizar alerta: ${error.message || 'Erro desconhecido'}`,
        duration: 3000,
        variant: "destructive"
      });
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      return await base44.entities.TradeAlert.delete(alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['tradeAlerts', trade.id] });
      setShowEditAlertDialog(false);
      setSelectedAlertForEdit(null);
      toast({
        title: "✅ Sucesso!",
        description: "Alerta excluído com sucesso.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: `Erro ao excluir alerta: ${error.message || 'Erro desconhecido'}`,
        duration: 3000,
        variant: "destructive"
      });
    }
  });

  const calculateProgress = () => {
    if (!trade.take_profit || !trade.stop_loss || !trade.entry_price) return { value: 0, isPositive: null };

    if (trade.status === "TAKE_PROFIT_HIT" || trade.status === "STOP_LOSS_HIT") {
      return { value: 100, isPositive: trade.status === "TAKE_PROFIT_HIT" };
    }
    if (trade.status === "CLOSED") {
      return { value: 0, isPositive: null };
    }

    const priceDiff = calculatedCurrentPrice - trade.entry_price;
    const isMovingPositive = isBuy ? priceDiff > 0 : priceDiff < 0;

    const entryToTP = isBuy ?
      trade.take_profit - trade.entry_price :
      trade.entry_price - trade.take_profit;
    const entryToSL = isBuy ?
      trade.entry_price - trade.stop_loss :
      trade.stop_loss - trade.entry_price;

    const totalRange = Math.abs(entryToTP) + Math.abs(entryToSL);

    if (totalRange === 0) return { value: 0, isPositive: null };

    let progress;
    if (isMovingPositive) {
      progress = Math.abs(priceDiff) / Math.abs(entryToTP) * 100;
    } else {
      progress = Math.abs(priceDiff) / Math.abs(entryToSL) * 100;
    }

    return { value: Math.min(100, Math.max(0, progress)), isPositive: isMovingPositive };
  };

  const progressData = calculateProgress();

  const generateTelegramText = () => {
    const typeEmoji = isBuy ? "🟢" : "🔴";
    const typeText = isBuy ? "COMPRA" : "VENDA";

    return `⚡️ SINAL DE TRADE ⚡️
↓
${typeEmoji} ${typeText}: ${trade.pair}
📍 Entrada: $ ${formatPrice(trade.entry_price || 0)}
🔻 SL: $ ${formatPrice(trade.stop_loss || 0)}
🎯 TP1: $ ${formatPrice(trade.take_profit || 0)}
↓
ℹ️ ${trade.notes || "Sem observações adicionais"}`;
  };

  const handleShareButtonClick = () => {
    setShowShareDialog(true);
  };

  const copyTradeText = async () => {
    if (!isInfinityPro) {
      setShowShareDialog(false);
      setShowUpgradeDialog(true);
      return;
    }

    try {
      const text = generateTelegramText();
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      toast({
        title: "Copiado!",
        description: "Texto do sinal copiado para a área de transferência.",
        duration: 2000
      });
      setTimeout(() => {
        setCopiedToClipboard(false);
        setShowShareDialog(false);
      }, 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
      toast({
        title: "Erro",
        description: "Erro ao copiar para área de transferência.",
        duration: 3000,
        variant: "destructive"
      });
    }
  };

  const downloadTradeImage = async () => {
    if (!isInfinityPro) {
      setShowShareDialog(false);
      setShowUpgradeDialog(true);
      return;
    }

    if (!shareCardRef.current) return;

    setGeneratingImage(true);
    try {
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trade-${trade.pair}-${formatDate(new Date(), 'dd-MM-yyyy-HHmm')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setGeneratingImage(false);
        toast({
          title: "Screenshot Gerado!",
          description: "Imagem do card baixada com sucesso.",
          duration: 3000
        });
        setShowShareDialog(false);
      });
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar imagem. Tente novamente.",
        duration: 3000,
        variant: "destructive"
      });
      setGeneratingImage(false);
    }
  };

  const handleClosePosition = () => {
    const confirmed = window.confirm(
      `Tem certeza que deseja fechar este trade manualmente?\n\n` +
      `Par: ${trade.pair}\n` +
      `Tipo: ${trade.type}\n` +
      `P/L: ${profitLoss.toFixed(2)}% (${profitLossUSD >= 0 ? '+' : ''}$ ${profitLossUSD.toFixed(2)})`
    );

    if (confirmed) {
      closePositionMutation.mutate();
    }
  };

  const handleEditTrade = () => {
    setEditForm({
      take_profit: trade.take_profit || 0,
      stop_loss: trade.stop_loss || 0,
      notes: trade.notes || ""
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    const updateData = {
      take_profit: parseFloat(editForm.take_profit),
      stop_loss: parseFloat(editForm.stop_loss),
      notes: String(editForm.notes || "")
    };

    editTradeMutation.mutate(updateData);
  };

  const handleSaveAlert = () => {
    if (!alertForm.name || !alertForm.condition_value) {
      alert("Por favor, preencha o nome e o valor da condição");
      return;
    }

    createAlertMutation.mutate(alertForm);
  };

  const handleAlertIconClick = (e) => {
    e.stopPropagation();
    if (tradeAlerts.length > 0) {
      const alert = tradeAlerts[0];
      setSelectedAlertForEdit(alert);
      setEditAlertForm({
        name: alert.name || "",
        condition_type: alert.condition_type || "pl_usd",
        condition_value: alert.condition_value || "",
        sound: alert.sound || "bell"
      });
      setShowEditAlertDialog(true);
    } else {
      setShowAlertDialog(true);
    }
  };

  const handleNotesIconClick = (e) => {
    e.stopPropagation();
    setEditNotesForm(trade.notes || "");
    setShowEditNotesDialog(true);
  };

  const handleSaveEditAlert = () => {
    if (!editAlertForm.name || !editAlertForm.condition_value) {
      alert("Por favor, preencha o nome e o valor da condição");
      return;
    }

    updateAlertMutation.mutate({
      alertId: selectedAlertForEdit.id,
      alertData: editAlertForm
    });
  };

  const handleDeleteAlert = () => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este alerta?");
    if (confirmed && selectedAlertForEdit) {
      deleteAlertMutation.mutate(selectedAlertForEdit.id);
    }
  };

  const handleSaveNotes = () => {
    updateNotesMutation.mutate(editNotesForm);
  };

  const handleDeleteNotes = () => {
    const confirmed = window.confirm("Tem certeza que deseja excluir esta observação?");
    if (confirmed) {
      updateNotesMutation.mutate("");
    }
  };

  const handleGenerateAINotes = async () => {
    setGeneratingAINotes(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de trading experiente. Analise este trade específico e gere UMA ÚNICA FRASE de NO MÁXIMO 10 PALAVRAS sobre o resultado ou situação atual:

DADOS DO TRADE:
Par: ${trade.pair}
Tipo: ${isBuy ? "COMPRA" : "VENDA"}
Entrada: $ ${trade.entry_price?.toFixed(2)}
Preço Atual: $ ${calculatedCurrentPrice.toFixed(2)}
Take Profit: $ ${trade.take_profit?.toFixed(2)}
Stop Loss: $ ${trade.stop_loss?.toFixed(2)}
P/L Atual: ${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}% (${profitLossUSD >= 0 ? '+$' : '$'}${profitLossUSD.toFixed(2)})
Alavancagem: ${leverage}x
Margem: $ ${entryAmount.toFixed(2)}
Total Operado: $ ${totalOperatedValue.toFixed(2)}

REGRAS OBRIGATÓRIAS:
1. MÁXIMO 10 PALAVRAS TOTAL
2. UMA ÚNICA FRASE
3. Seja direto e objetivo
4. Foque no resultado ou situação ATUAL do trade
5. Mencione se está em lucro ou prejuízo
6. Não use jargões técnicos complexos

Exemplo de resposta válida:
"Trade em lucro, próximo do take profit alvo"
"Operação negativa, necessita atenção para stop loss"
"Resultado positivo, mantém tendência de alta favorável"`,
        add_context_from_internet: false
      });

      setEditNotesForm(response);
    } catch (error) {
      console.error("Erro ao gerar observação com IA:", error);
      alert("Erro ao gerar observação. Tente novamente.");
    } finally {
      setGeneratingAINotes(false);
    }
  };

  const handleGenerateEditAINotes = async () => {
    // VERIFICAÇÃO USANDO CONTROLE DE ACESSO CENTRALIZADO
    if (!isInfinityPro) {
      setShowEditDialog(false);
      setShowUpgradeDialog(true);
      return;
    }

    setGeneratingEditAINotes(true);
    try {
      const analysisStyles = [
        "técnico_momentum",
        "técnico_suporteresistencia",
        "fundamentalista_sentimento",
        "volume_liquidez",
        "tendencia_macro",
        "volatilidade_risco"
      ];

      const randomStyle = analysisStyles[Math.floor(Math.random() * analysisStyles.length)];

      let specificInstructions = "";

      switch (randomStyle) {
        case "técnico_momentum":
          specificInstructions = "Foque em momentum de mercado, RSI, MACD e força da tendência atual. Mencione se há sinais de continuação ou reversão.";
          break;
        case "técnico_suporteresistencia":
          specificInstructions = "Analise zonas de suporte e resistência, níveis de Fibonacci, e se o preço está em zona de acumulação ou distribuição.";
          break;
        case "fundamentalista_sentimento":
          specificInstructions = "Comente sobre sentimento do mercado, notícias recentes impactando o ativo, e contexto macro atual afetando criptomoedas.";
          break;
        case "volume_liquidez":
          specificInstructions = "Analise volume de negociação, liquidez do par, interesse de mercado e força dos movimentos de preço baseado em volume.";
          break;
        case "tendencia_macro":
          specificInstructions = "Foque na tendência de longo prazo, contexto do mercado cripto geral, correlação com BTC e perspectiva de médio prazo.";
          break;
        case "volatilidade_risco":
          specificInstructions = "Comente sobre volatilidade atual, gerenciamento de risco, tamanho da posição adequado e níveis de stop loss dinâmicos.";
          break;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista técnico profissional de criptomoedas. Busque e analise dados REAIS e ATUAIS do mercado de ${trade.pair}.

TRADE ABERTO:
- Par: ${trade.pair}
- Tipo: ${isBuy ? "COMPRA (LONG)" : "VENDA (SHORT)"}
- Entrada: $ ${trade.entry_price?.toFixed(2)}
- Preço Atual: $ ${calculatedCurrentPrice.toFixed(2)}
- Take Profit: $ ${trade.take_profit?.toFixed(2)}
- Stop Loss: $ ${trade.stop_loss?.toFixed(2)}
- P/L: ${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}% (${profitLossUSD >= 0 ? '+$' : '$'}${profitLossUSD.toFixed(2)})
- Alavancagem: ${leverage}x
- Margem: $ ${entryAmount.toFixed(2)}

INSTRUÇÕES CRÍTICAS:
1. BUSQUE DADOS REAIS sobre ${trade.pair}: preço atual, volume 24h, tendência, variação, RSI, suportes/resistências
2. ${specificInstructions}
3. Seja ESPECÍFICO sobre o mercado ATUAL de ${trade.pair} - use os dados que você encontrou
4. APOIE a posição ${isBuy ? "LONG" : "SHORT"} aberta, mas seja REALISTA
5. VARIE sua análise - não repita padrões. Cada análise deve ser ÚNICA
6. LIMITE MÁXIMO: 25 PALAVRAS (conte as palavras!)
7. NUNCA mencione fontes, sites, links ou de onde veio a informação
8. NUNCA diga "de acordo com...", "segundo...", "baseado em..."
9. Retorne APENAS o texto da observação, limpo e direto
10. Seja CONCISO e DIRETO - máximo 25 palavras

EXEMPLOS DE ESTILOS VARIADOS (NÃO COPIE - CRIE NOVO):
- "RSI 45 indica espaço alta, volume crescente confirma momentum ${isBuy ? 'comprador' : 'vendedor'}"
- "Preço testando resistência $X, rompimento confirmaria setup ${isBuy ? 'long' : 'short'}"
- "Acumulação em suporte forte, histórico mostra reversão favorável 72% casos"
- "MACD cruzando bullish, médias móveis alinhadas, tendência curto prazo favorável"
- "Sentimento positivo após notícia, volume institucional aumentando 40% hoje"`,
        add_context_from_internet: true
      });

      let cleanedResponse = response.
        replace(/^##.*$/gm, '').
        replace(/^-.*$/gm, '').
        replace(/^\*.*$/gm, '').
        replace(/\n+/g, ' ').
        replace(/de acordo com.*/gi, '').
        replace(/segundo.*/gi, '').
        replace(/basseado em.*/gi, '').
        replace(/fonte:.*/gi, '').
        replace(/https?:\/\/[^\s]+/g, '').
        replace(/www\.[^\s]+/g, '').
        trim().
        split('\n')[0].
        replace(/["']/g, '').
        trim();

      const words = cleanedResponse.split(/\s+/).filter((word) => word.length > 0);
      if (words.length > 25) {
        cleanedResponse = words.slice(0, 25).join(' ');
      }

      const finalResponse = cleanedResponse.endsWith('.') ?
        cleanedResponse :
        cleanedResponse + '.';

      setEditForm((prev) => ({ ...prev, notes: finalResponse }));
    } catch (error) {
      console.error("Erro ao gerar observação com IA:", error);
      alert("Erro ao gerar observação. Tente novamente.");
    } finally {
      setGeneratingEditAINotes(false);
    }
  };

  React.useEffect(() => {
    if (trade.status === "TAKE_PROFIT_HIT" || trade.status === "STOP_LOSS_HIT") {
      setShowAlert(true);
    }
  }, [trade.status]);

  const isFromAI = trade.from_ai_trader === true;

  const maskValue = (value) => {
    const strValue = String(value || "");
    if (strValue.length <= 2) return "***";
    return strValue.substring(0, 2) + "***";
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={isHighlighted ? "ring-4 ring-emerald-500 ring-opacity-70 rounded-xl shadow-lg shadow-emerald-500/50" : ""}
        onMouseEnter={() => setShowButtons(true)}
        onMouseLeave={() => setShowButtons(false)}
        onClick={(e) => {
          const isButton = e.target.closest('button');
          if (!isButton && onCardClick) {
            onCardClick(trade);
          }
          setShowButtons(!showButtons);
        }}>

        <Card className="bg-slate-800/46 backdrop-blur-md border-slate-700/30 overflow-hidden hover:border-slate-600/40 hover:bg-slate-800/50 transition-all duration-300 shadow-xl relative">
          {showAlert &&
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              className={`${
                trade.status === "TAKE_PROFIT_HIT" ?
                  "bg-emerald-500/20 border-b-2 border-emerald-500" :
                  "bg-red-500/20 border-b-2 border-red-500"} p-2 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-3`
              }>

              <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                trade.status === "TAKE_PROFIT_HIT" ? "text-emerald-400" : "text-red-400"}`
              } />
              <span className="text-white font-semibold text-xs sm:text-sm md:text-base">
                {trade.status === "TAKE_PROFIT_HIT" ? "🎉 Take Profit Atingido!" : "⚠️ Stop Loss Atingido!"}
              </span>
            </motion.div>
          }

          <div className="bg-slate-900 p-3 sm:p-4 md:p-5">
            <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {/* ESTRELA DE FAVORITO */}
                  <motion.button
                    onClick={handleStarClick}
                    className="relative flex items-center justify-center p-1 rounded-full cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}>

                    <Star className={`w-4 h-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-slate-500 hover:text-slate-300"}`} />
                    {isFavorite &&
                      <>
                        <motion.div
                          className="absolute -top-1 left-1/2 w-1 h-1 rounded-full bg-orange-500"
                          animate={{
                            y: [-2, -8],
                            x: [-2, -4],
                            opacity: [1, 0],
                            scale: [0.5, 0]
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            repeatDelay: 0.2
                          }} />

                        <motion.div
                          className="absolute -top-1 left-1/2 w-1 h-1 rounded-full bg-yellow-500"
                          animate={{
                            y: [-2, -7],
                            x: [0, -1],
                            opacity: [1, 0],
                            scale: [0.5, 0]
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatDelay: 0.3
                          }} />

                        <motion.div
                          className="absolute -top-1 right-1 w-1 h-1 rounded-full bg-red-500"
                          animate={{
                            y: [-1, -6],
                            x: [0, 2],
                            opacity: [1, 0],
                            scale: [0.5, 0]
                          }}
                          transition={{
                            duration: 0.7,
                            repeat: Infinity,
                            repeatDelay: 0.1
                          }} />

                      </>
                    }
                  </motion.button>

                  {/* LOGO DA MOEDA - USANDO NOVO SISTEMA */}
                  <CoinLogo pair={trade.pair || "BTC/USDT"} className="w-5 h-5 sm:w-6 sm:h-6" />

                  <h3 className="text-[0.9rem] sm:text-[1.05rem] md:text-[0.702rem] lg:text-[1.08rem] font-bold text-white truncate">{trade.pair || "N/A"}</h3>

                  {isActive &&
                    <motion.div
                      className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full bg-emerald-500/20"
                      animate={{
                        boxShadow: [
                          "0 0 0px rgba(16, 185, 129, 0)",
                          "0 0 8px rgba(16, 185, 129, 0.4)",
                          "0 0 0px rgba(16, 185, 129, 0)"]

                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}>

                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </motion.div>
                  }

                  {hasActiveAlerts && isActive &&
                    <motion.button
                      onClick={handleAlertIconClick}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 cursor-pointer hover:bg-yellow-500/30 transition-colors"
                      animate={{
                        boxShadow: [
                          "0 0 0px rgba(234, 179, 8, 0)",
                          "0 0 8px rgba(234, 179, 8, 0.6)",
                          "0 0 0px rgba(234, 179, 8, 0)"]

                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}>

                      <Bell className="w-2.5 h-2.5 text-yellow-400" />
                    </motion.button>
                  }

                  {isActive && trade.notes && trade.notes.trim().length > 0 &&
                    <motion.button
                      onClick={handleNotesIconClick}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 cursor-pointer hover:bg-blue-500/30 transition-colors"
                      animate={{
                        boxShadow: [
                          "0 0 0px rgba(59, 130, 246, 0)",
                          "0 0 8px rgba(59, 130, 246, 0.6)",
                          "0 0 0px rgba(59, 130, 246, 0)"]

                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}>

                      <BookOpen className="w-2.5 h-2.5 text-blue-400" />
                    </motion.button>
                  }
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`${
                    isBuy
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  } border px-2 py-1 rounded flex items-center justify-center w-6 h-6`}>
                    <span className="font-black text-xs">{isBuy ? "B" : "S"}</span>
                  </div>
                  {leverage > 1 &&
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border px-2 py-0.5 sm:py-1" style={{ fontSize: '8.7px' }}>
                      {leverage}x
                    </Badge>
                  }
                  {isFromAI &&
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">

                      <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-purple-400" />
                      <span style={{ fontSize: '8.7px' }} className="font-bold text-purple-400">iA</span>
                    </motion.div>
                  }
                  {isActive && tradeOpenTime &&
                    <span className="text-[8px] sm:text-[10px] text-slate-400 bg-slate-800/50 px-2 py-0.5 sm:py-1 rounded-md">
                      {tradeOpenTime}
                    </span>
                  }
                </div>
              </div>

              <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                <motion.div
                  key={`usd-${profitLossUSD.toFixed(2)}`}
                  initial={{ opacity: 0.7, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`text-sm sm:text-base md:text-lg lg:text-xl font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}
                  style={{ whiteSpace: 'nowrap', overflow: 'visible', textAlign: 'right' }}>

                  {hideBalances ? "****" : `${profitLossUSD >= 0 ? "+" : ""}${profitLossUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </motion.div>

                <motion.div
                  key={`pct-${profitLoss.toFixed(2)}`}
                  initial={{ opacity: 0.7, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
                  className={`text-[9px] sm:text-[10px] md:text-xs font-medium mt-0.5 flex items-center gap-1 justify-end ${isProfit ? "text-emerald-400" : "text-red-400"}`}>

                  {isProfit ? <TrendingUp className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> : <TrendingDown className="w-2 h-2 sm:w-2.5 sm:h-2.5" />}
                  {profitLoss >= 0 ? "+" : ""}{profitLoss.toFixed(2)}%
                </motion.div>
              </div>
            </div>

            <div className="mb-2 sm:mb-3">
              <div className="h-4 sm:h-5 bg-slate-800/50 rounded-full overflow-hidden relative">
                {trade.status === "CLOSED" ?
                  <div className="h-full flex items-center justify-center bg-slate-700/50">
                    <span className="text-slate-400 font-medium text-[9px] sm:text-[10px]">Encerrado Manualmente</span>
                  </div> :

                  <>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressData.value}%` }}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut"
                      }}
                      className={`h-full ${
                        progressData.isPositive ?
                          "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" :
                          "bg-gradient-to-r from-red-500 via-red-400 to-red-500"} relative`
                      }>

                      <motion.div
                        className="absolute inset-0 bg-white/30"
                        animate={{
                          x: ['-100%', '100%']
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        style={{
                          width: '50%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
                        }} />

                    </motion.div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span
                        key={progressData.value.toFixed(2)}
                        initial={{ opacity: 0.7, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`font-bold text-[10px] sm:text-xs drop-shadow-lg ${
                          progressData.isPositive ? "text-emerald-300" : "text-red-300"}`
                        }>

                        {progressData.value.toFixed(2)}%
                      </motion.span>
                    </div>
                  </>
                }
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 mb-2 text-[9px] sm:text-[10px]">
              <div className="bg-slate-800/30 rounded px-1.5 py-1 text-center">
                <span className="text-slate-500 block mb-0.5">Margem</span>
                <span className="text-slate-300 font-semibold block" style={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
                  {hideBalances ? "***" : `${entryAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="bg-slate-800/30 rounded px-1.5 py-1 text-center">
                <span className="text-slate-500 block mb-0.5">Total</span>
                <span className="text-slate-300 font-semibold block" style={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
                  {hideBalances ? "***" : `${totalOperatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="bg-slate-800/30 rounded px-1.5 py-1 text-center">
                <span className="text-slate-500 block mb-0.5">Entrada</span>
                <span className="text-slate-300 font-semibold block" style={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
                  $ {formatPrice(trade.entry_price || 0)}
                </span>
              </div>
              <div className="bg-slate-800/30 rounded px-1.5 py-1 text-center">
                <span className="text-slate-500 block mb-0.5">Atual</span>
                <span className="text-slate-300 font-semibold block" style={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
                  $ {formatPrice(calculatedCurrentPrice)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[9px] sm:text-[10px]">
              <div className="bg-slate-800/30 rounded px-2 py-1 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-0.5">
                  <Target className="w-2 h-2" /> TP:
                </span>
                <span className="text-slate-300 font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
                  $ {formatPrice(trade.take_profit)}
                </span>
              </div>
              <div className="bg-slate-800/30 rounded px-2 py-1 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-0.5">
                  <AlertTriangle className="w-2 h-2" /> SL:
                </span>
                <span className="text-slate-300 font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
                  $ {formatPrice(trade.stop_loss)}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {isActive && showButtons &&
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 flex justify-center gap-1.5 md:gap-2 overflow-hidden">

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAlertDialog(true);
                          }}
                          size="sm"
                          className="h-6 w-6 p-0 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 hover:text-yellow-300 border border-yellow-500/40 backdrop-blur-sm hidden md:flex items-center justify-center">

                          <Bell className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-slate-800 border-slate-700 text-white text-xs">
                        <p>Alerta</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareButtonClick();
                          }}
                          size="sm"
                          className="h-6 w-6 p-0 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 border border-purple-500/40 backdrop-blur-sm hidden md:flex items-center justify-center">

                          <Share2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-slate-800 border-slate-700 text-white text-xs">
                        <p>Compartilhar</p>
                      </TooltipContent>
                    </Tooltip>

                    {user?.role === "admin" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPublishStudyDialog(true);
                            }}
                            size="sm"
                            className="h-6 w-6 p-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400 border border-purple-500/40 backdrop-blur-sm hidden md:flex items-center justify-center">
                            <GraduationCap className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-slate-800 border-slate-700 text-white text-xs">
                          <p>Publicar Estudo</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTrade();
                          }}
                          size="sm"
                          className="h-6 w-6 p-0 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 border border-blue-500/40 backdrop-blur-sm hidden md:flex items-center justify-center">

                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-slate-800 border-slate-700 text-white text-xs">
                        <p>Editar</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClosePosition();
                          }}
                          disabled={closePositionMutation.isPending}
                          size="sm"
                          className="h-6 w-6 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm hidden md:flex items-center justify-center">

                          {closePositionMutation.isPending ?
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div> :

                            <XCircle className="w-3.5 h-3.5" />
                          }
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-slate-800 border-slate-700 text-white text-xs">
                        <p>Fechar</p>
                      </TooltipContent>
                    </Tooltip>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAlertDialog(true);
                      }}
                      size="sm"
                      className="h-6 w-6 p-0 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 hover:text-yellow-300 border border-yellow-500/40 backdrop-blur-sm md:hidden flex items-center justify-center">

                      <Bell className="w-3 h-3" />
                    </Button>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareButtonClick();
                      }}
                      size="sm"
                      className="h-6 w-6 p-0 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 border border-purple-500/40 backdrop-blur-sm md:hidden flex items-center justify-center">

                      <Share2 className="w-3 h-3" />
                    </Button>

                    {user?.role === "admin" && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPublishStudyDialog(true);
                        }}
                        size="sm"
                        className="h-6 w-6 p-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400 border border-purple-500/40 backdrop-blur-sm md:hidden flex items-center justify-center">
                        <GraduationCap className="w-3 h-3" />
                      </Button>
                    )}

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTrade();
                      }}
                      size="sm"
                      className="h-6 w-6 p-0 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 border border-blue-500/40 backdrop-blur-sm md:hidden flex items-center justify-center">

                      <Edit2 className="w-3 h-3" />
                    </Button>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClosePosition();
                      }}
                      disabled={closePositionMutation.isPending}
                      size="sm"
                      className="h-6 w-6 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm md:hidden flex items-center justify-center">

                      {closePositionMutation.isPending ?
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> :

                        <XCircle className="w-3 h-3" />
                      }
                    </Button>
                  </TooltipProvider>
                </motion.div>
              }
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* CONDITIONAL RENDERING: Desktop vs Mobile */}
      {isMobile ?
        <SocialShareCardPreviewMobile
          open={showSocialPreview}
          onOpenChange={setShowSocialPreview}
          trade={trade}
          currentPrice={calculatedCurrentPrice} /> :


        <SocialShareCardPreview
          open={showSocialPreview}
          onOpenChange={setShowSocialPreview}
          trade={trade}
          currentPrice={calculatedCurrentPrice} />

      }

      <UpgradeInfinityPRODialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} />
      
      <PublishStudyDialog 
        open={showPublishStudyDialog} 
        onOpenChange={setShowPublishStudyDialog}
        trade={trade}
      />

      {/* Edit Trade Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Trade</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="take_profit" className="text-right text-slate-300">
                Take Profit
              </Label>
              <Input
                id="take_profit"
                type="number"
                step="0.00000001"
                value={editForm.take_profit}
                onChange={(e) => setEditForm({ ...editForm, take_profit: e.target.value })}
                className="col-span-3 bg-slate-800 text-white border-slate-700" />

            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stop_loss" className="text-right text-slate-300">
                Stop Loss
              </Label>
              <Input
                id="stop_loss"
                type="number"
                step="0.00000001"
                value={editForm.stop_loss}
                onChange={(e) => setEditForm({ ...editForm, stop_loss: e.target.value })}
                className="col-span-3 bg-slate-800 text-white border-slate-700" />

            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right text-slate-300">
                Notas
              </Label>
              <div className="col-span-3 flex flex-col gap-2">
                <Textarea
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="bg-slate-800 text-white border-slate-700 min-h-[80px]" />

                <Button
                  onClick={handleGenerateEditAINotes}
                  disabled={generatingEditAINotes}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white">

                  {generatingEditAINotes ?
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> :

                    <Sparkles className="h-4 w-4" />
                  }
                  Gerar Análise com iA
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSaveEdit}
              disabled={editTradeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white">

              {editTradeMutation.isPending ? "Salvando..." : "Salvar mudanças"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-[400px] bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-400" /> Compartilhar Trade
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col gap-4">
            <Button
              onClick={() => {
                if (!isInfinityPro) {
                  setShowShareDialog(false);
                  setShowUpgradeDialog(true);
                  return;
                }
                setShowShareDialog(false);
                setShowSocialPreview(true);
              }}
              disabled={!isInfinityPro}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white h-12 text-base font-bold">

              <Download className="w-5 h-5 mr-2" />
              Baixar Card de Ganhos
            </Button>

            {/* This div is the content that gets captured by 'downloadTradeImage' (original screenshot functionality) */}
            <div className="relative p-4 rounded-lg border border-slate-700 bg-slate-800/50" ref={shareCardRef}>
              <h4 className="text-lg font-bold text-white mb-2">{trade.pair}</h4>
              <p className={`text-sm ${isBuy ? "text-emerald-400" : "text-red-400"} mb-1`}>
                Tipo: {trade.type}
              </p>
              <p className="text-sm text-slate-300 mb-1">
                Entrada: {isInfinityPro ? `$ ${formatPrice(trade.entry_price)}` : `$ ${maskValue(formatPrice(trade.entry_price))}`}
              </p>
              <p className="text-sm text-slate-300 mb-1">
                TP: {isInfinityPro ? `$ ${formatPrice(trade.take_profit)}` : `$ ${maskValue(formatPrice(trade.take_profit))}`}
              </p>
              <p className="text-sm text-slate-300 mb-1">
                SL: {isInfinityPro ? `$ ${formatPrice(trade.stop_loss)}` : `$ ${maskValue(formatPrice(trade.stop_loss))}`}
              </p>
              <p className="text-sm text-slate-300 mb-1">
                Alavancagem: {isInfinityPro ? `${trade.leverage}x` : "***"}
              </p>
              <p className={`text-base font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                P/L: {isInfinityPro ?
                  `${profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}% (${profitLossUSD >= 0 ? "+" : ""}${profitLossUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` :
                  `*** (+$ ***)`
                }
              </p>
              {trade.notes &&
                <p className="text-xs text-slate-400 mt-2 italic">
                  {isInfinityPro ?
                    `"${trade.notes}"` :
                    `"${trade.notes.substring(0, Math.min(20, trade.notes.length))} [APENAS INFINITY PRO] ..."`
                  }
                </p>
              }

              {!isInfinityPro &&
                <div
                  onClick={() => {
                    setShowShareDialog(false);
                    setShowUpgradeDialog(true);
                  }}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] rounded-lg flex items-center justify-center cursor-pointer">

                  <div className="text-center p-4">
                    <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                    <p className="text-purple-400 font-bold text-sm">Recurso Infinity Pro</p>
                  </div>
                </div>
              }
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={downloadTradeImage}
                disabled={generatingImage || !isInfinityPro}
                className="w-full bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 text-blue-400 h-12 text-base font-semibold">

                {generatingImage ?
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-2"></div>
                    Gerando...
                  </> :

                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Baixar Screenshot
                  </>
                }
              </Button>

              <Button
                onClick={copyTradeText}
                disabled={!isInfinityPro}
                className="w-full bg-slate-800/50 border border-slate-700 hover:bg-slate-800 text-white h-12 text-base font-semibold">

                {copiedToClipboard ? <Check className="h-5 w-5 mr-2" /> : <Copy className="h-5 w-5 mr-2" />}
                {copiedToClipboard ? "Copiado!" : "Copiar Texto"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="w-full bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/30 hover:text-red-300"
              onClick={() => setShowShareDialog(false)}>

              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog (Create) */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" /> Criar Alerta para {trade.pair}
            </DialogTitle>
          </DialogHeader>

          <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 mb-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Par:</span>
                <span className="text-white font-semibold ml-1">{trade.pair}</span>
              </div>
              <div>
                <span className="text-slate-500">Tipo:</span>
                <span className={`font-semibold ml-1 ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trade.type}
                </span>
              </div>
              <div>
                <span className="text-slate-500">P/L $:</span>
                <span className={`font-semibold ml-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profitLossUSD >= 0 ? '+' : ''}{profitLossUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-500">P/L %:</span>
                <span className={`font-semibold ml-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {`${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}%`}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Entrada:</span>
                <span className="text-white font-semibold ml-1">$ {formatPrice(trade.entry_price || 0)}</span>
              </div>
              <div>
                <span className="text-slate-500">Atual:</span>
                <span className="text-white font-semibold ml-1">$ {formatPrice(calculatedCurrentPrice)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alertName" className="text-right text-slate-300">
                Nome
              </Label>
              <Input
                id="alertName"
                value={alertForm.name}
                onChange={(e) => setAlertForm({ ...alertForm, name: e.target.value })}
                className="col-span-3 bg-slate-800 text-white border-slate-700" />

            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="conditionType" className="text-right text-slate-300">
                Condição
              </Label>
              <Select
                value={alertForm.condition_type}
                onValueChange={(value) => setAlertForm({ ...alertForm, condition_type: value })}>

                <SelectTrigger className="col-span-3 bg-slate-800 text-white border-slate-700">
                  <SelectValue placeholder="Selecione tipo de condição" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-slate-700">
                  <SelectItem value="pl_usd">P/L Dólar</SelectItem>
                  <SelectItem value="pl_percentage">P/L Porcentagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="conditionValue" className="text-right text-slate-300">
                Valor
              </Label>
              <Input
                id="conditionValue"
                type="number"
                step="0.00000001"
                value={alertForm.condition_value}
                onChange={(e) => setAlertForm({ ...alertForm, condition_value: e.target.value })}
                placeholder={alertForm.condition_type === "pl_percentage" ? "Ex: 20" : "Ex: 150"}
                className="col-span-3 bg-slate-800 text-white border-slate-700" />

            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alertSound" className="text-right text-slate-300">
                Som
              </Label>
              <Select
                value={alertForm.sound}
                onValueChange={(value) => setAlertForm({ ...alertForm, sound: value })}>

                <SelectTrigger className="col-span-3 bg-slate-800 text-white border-slate-700">
                  <SelectValue placeholder="Selecione som do alerta" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-slate-700">
                  {ALERT_SOUNDS.map((sound) =>
                    <SelectItem key={sound.value} value={sound.value}>
                      {sound.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSaveAlert}
              disabled={createAlertMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white">

              {createAlertMutation.isPending ? "Criando..." : "Criar Alerta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog (Edit/Delete) */}
      <Dialog open={showEditAlertDialog} onOpenChange={setShowEditAlertDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" /> Editar Alerta para {trade.pair}
            </DialogTitle>
          </DialogHeader>

          <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 mb-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Par:</span>
                <span className="text-white font-semibold ml-1">{trade.pair}</span>
              </div>
              <div>
                <span className="text-slate-500">Tipo:</span>
                <span className={`font-semibold ml-1 ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trade.type}
                </span>
              </div>
              <div>
                <span className="text-slate-500">P/L $:</span>
                <span className={`font-semibold ml-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profitLossUSD >= 0 ? '+' : ''}{profitLossUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-500">P/L %:</span>
                <span className={`font-semibold ml-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {`${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}%`}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Entrada:</span>
                <span className="text-white font-semibold ml-1">$ {formatPrice(trade.entry_price || 0)}</span>
              </div>
              <div>
                <span className="text-slate-500">Atual:</span>
                <span className="text-white font-semibold ml-1">$ {formatPrice(calculatedCurrentPrice)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editAlertName" className="text-right text-slate-300">
                Nome
              </Label>
              <Input
                id="editAlertName"
                value={editAlertForm.name}
                onChange={(e) => setEditAlertForm({ ...editAlertForm, name: e.target.value })}
                className="col-span-3 bg-slate-800 text-white border-slate-700" />

            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editConditionType" className="text-right text-slate-300">
                Condição
              </Label>
              <Select
                value={editAlertForm.condition_type}
                onValueChange={(value) => setEditAlertForm({ ...editAlertForm, condition_type: value })}>

                <SelectTrigger className="col-span-3 bg-slate-800 text-white border-slate-700">
                  <SelectValue placeholder="Selecione tipo de condição" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-slate-700">
                  <SelectItem value="pl_usd">P/L Dólar</SelectItem>
                  <SelectItem value="pl_percentage">P/L Porcentagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editConditionValue" className="text-right text-slate-300">
                Valor
              </Label>
              <Input
                id="editConditionValue"
                type="number"
                step="0.00000001"
                value={editAlertForm.condition_value}
                onChange={(e) => setEditAlertForm({ ...editAlertForm, condition_value: e.target.value })}
                placeholder={editAlertForm.condition_type === "pl_percentage" ? "Ex: 20" : "Ex: 150"}
                className="col-span-3 bg-slate-800 text-white border-slate-700" />

            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editAlertSound" className="text-right text-slate-300">
                Som
              </Label>
              <Select
                value={editAlertForm.sound}
                onValueChange={(value) => setEditAlertForm({ ...editAlertForm, sound: value })}>

                <SelectTrigger className="col-span-3 bg-slate-800 text-white border-slate-700">
                  <SelectValue placeholder="Selecione som do alerta" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-slate-700">
                  {ALERT_SOUNDS.map((sound) =>
                    <SelectItem key={sound.value} value={sound.value}>
                      {sound.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteAlert}
              disabled={deleteAlertMutation.isPending}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white">

              {deleteAlertMutation.isPending ?
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> :

                <Trash2 className="h-4 w-4 mr-2" />
              }
              Excluir Alerta
            </Button>
            <Button
              type="submit"
              onClick={handleSaveEditAlert}
              disabled={updateAlertMutation.isPending}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white mt-2 sm:mt-0">

              {updateAlertMutation.isPending ? "Salvando..." : "Salvar Mudanças"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showEditNotesDialog} onOpenChange={setShowEditNotesDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" /> Observações do Trade
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              value={editNotesForm}
              onChange={(e) => setEditNotesForm(e.target.value)}
              placeholder="Adicione suas observações aqui..."
              className="bg-slate-800 text-white border-slate-700 min-h-[120px]" />

            <Button
              onClick={handleGenerateAINotes}
              disabled={generatingAINotes}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white">

              {generatingAINotes ?
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> :

                <Sparkles className="h-4 w-4" />
              }
              Gerar com iA (Simplificado)
            </Button>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteNotes}
              disabled={updateNotesMutation.isPending}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white">

              {updateNotesMutation.isPending && editNotesForm === "" ?
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> :

                <Trash2 className="h-4 w-4 mr-2" />
              }
              Excluir Observação
            </Button>
            <Button
              type="submit"
              onClick={handleSaveNotes}
              disabled={updateNotesMutation.isPending}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white mt-2 sm:mt-0">

              {updateNotesMutation.isPending && editNotesForm !== "" ? "Salvando..." : "Salvar Observação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}