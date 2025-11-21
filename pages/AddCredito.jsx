import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CreditCard, Zap, TrendingUp, Shield, DollarSign, Check, Copy, Loader2, CheckCircle2, Clock, AlertCircle, Phone, Sparkles, Crown, Infinity as InfinityIcon, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import CreditCardForm from "@/components/payment/CreditCardForm";

const ALL_CREDIT_PACKAGES = [
  { id: "1", name: "PackCrédito Start", value: 150, label: "R$ 150,00" },
  { id: "2", name: "PackCrédito Trader", value: 500, label: "R$ 500,00" },
  { id: "3", name: "PackCrédito Gestor", value: 1000, label: "R$ 1.000,00" },
  { id: "4", name: "PackCrédito Business", value: 5000, label: "R$ 5.000,00" },
  { id: "5", name: "PackCrédito LíderVIP1", value: 10000, label: "R$ 10.000,00" },
  { id: "6", name: "PackCrédito LíderCripto", value: 25000, label: "R$ 25.000,00" },
  { id: "7", name: "PackCrédito Builder", value: 50000, label: "R$ 50.000,00" }
];

const FIRST_TIME_BENEFITS = [
  { icon: TrendingUp, title: "Aumento de Limite", description: "Cada R$ 1 = +C$ 3 de limite na conta" },
  { icon: Crown, title: "Sinais VIP Exclusivos", description: "Acesso a sinais premium do admin" },
  { icon: Sparkles, title: "Suporte Prioritário", description: "Atendimento VIP para compras acima de R$ 1.000" },
  { icon: InfinityIcon, title: "Limite Ilimitado", description: "Sem restrições de trades ou iA Trader" }
];

const formatCPFCNPJ = (value) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  } else {
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
};

const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
};

export default function AddCredito() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [availablePackages, setAvailablePackages] = useState(ALL_CREDIT_PACKAGES);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [initialBalance, setInitialBalance] = useState(null);
  const [creditCardData, setCreditCardData] = useState(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [eduzzScriptLoaded, setEduzzScriptLoaded] = useState(false);
  const [eduzzInitialized, setEduzzInitialized] = useState(false);

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    refetchInterval: showPaymentDialog ? 3000 : false,
  });

  // Carregar script da Eduzz uma vez ao montar o componente
  useEffect(() => {
    if (!window.Eduzz && !eduzzScriptLoaded) {
      const script = document.createElement('script');
      script.src = 'https://cdn.eduzzcdn.com/sun/bridge/bridge.js';
      script.async = true;
      script.type = 'module';
      script.onload = () => setEduzzScriptLoaded(true);
      document.body.appendChild(script);
    } else if (window.Eduzz) {
      setEduzzScriptLoaded(true);
    }
  }, []);

  // Resetar e limpar quando dialog fechar
  useEffect(() => {
    if (!showPaymentDialog) {
      setEduzzInitialized(false);
      const element = document.getElementById('eduzz-elements');
      if (element) {
        element.innerHTML = '';
      }
    }
  }, [showPaymentDialog]);

  // Inicializar checkout da Eduzz quando o dialog abrir
  useEffect(() => {
    if (showPaymentDialog && paymentData?.contentId && eduzzScriptLoaded && window.Eduzz && !eduzzInitialized) {
      const timer = setTimeout(() => {
        const element = document.getElementById('eduzz-elements');
        if (element && window.Eduzz.Checkout && !eduzzInitialized) {
          // Limpar completamente
          element.innerHTML = '';
          
          try {
            window.Eduzz.Checkout.init({
              contentId: paymentData.contentId,
              target: 'eduzz-elements',
              errorCover: true
            });
            setEduzzInitialized(true);
          } catch (error) {
            // Silenciar erro de "already initialized"
            if (!error.message?.includes('already initialized')) {
              console.error('Erro ao inicializar Eduzz:', error);
            }
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showPaymentDialog, paymentData, eduzzScriptLoaded, eduzzInitialized]);

  const isFirstTimeBuyer = !user?.credit_purchase_total_brl || user.credit_purchase_total_brl === 0;

  useEffect(() => {
    if (showPaymentDialog && !initialBalance && user) {
      setInitialBalance(user.account_credit_balance || 0);
    }
  }, [showPaymentDialog, user]);

  useEffect(() => {
    if (showPaymentDialog && user && initialBalance !== null) {
      const currentBalance = user.account_credit_balance || 0;
      const expectedIncrease = paymentData?.packageInfo?.value || 0;
      const actualIncrease = currentBalance - initialBalance;

      if (
        user.last_payment_status === 'confirmed' && 
        actualIncrease >= expectedIncrease &&
        !paymentConfirmed
      ) {
        setPaymentConfirmed(true);
        setShowSuccessNotification(true);
        setCountdown(3);
      }
    }
  }, [user?.last_payment_status, user?.account_credit_balance, showPaymentDialog, paymentConfirmed, initialBalance, paymentData]);

  useEffect(() => {
    if (paymentConfirmed && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (paymentConfirmed && countdown === 0) {
      setShowPaymentDialog(false);
      navigate(createPageUrl("AITrader"));
    }
  }, [paymentConfirmed, countdown, navigate]);

  const handleCpfCnpjChange = (e) => {
    setCpfCnpj(formatCPFCNPJ(e.target.value));
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  // Buscar pacotes disponíveis
  useEffect(() => {
    const checkAvailablePackages = async () => {
      try {
        const response = await base44.functions.invoke('checkEduzzPackages');
        if (response.data?.availablePackages) {
          const available = ALL_CREDIT_PACKAGES.filter(pkg => 
            response.data.availablePackages.includes(pkg.id)
          );
          if (available.length > 0) {
            setAvailablePackages(available);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar pacotes:', error);
      }
    };

    checkAvailablePackages();
  }, []);

  const selectedPackageData = availablePackages.find(p => p.id === selectedPackage);

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method);
  };

  const handleOpenPixModal = () => {
    setShowPixModal(true);
  };

  const handleOpenCardModal = () => {
    setShowCardModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!paymentMethod || !selectedPackage || cpfCnpj.length < 14 || phone.length < 14) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setIsProcessing(true);
    setErrorDetails(null);
    setPaymentConfirmed(false);
    setInitialBalance(null);

    try {
      const response = await base44.functions.invoke('initiateEduzzPayment', {
        packageId: selectedPackage
      });

      if (response.data.status !== 'success') {
        const errorMsg = response.data.error || "Erro desconhecido";
        setErrorDetails(response.data);
        toast.error("Erro: " + errorMsg);
        setShowPixModal(false);
        setShowCardModal(false);
        return;
      }

      setPaymentData(response.data);
      setShowPixModal(false);
      setShowCardModal(false);
      setShowPaymentDialog(true);

    } catch (error) {
      setErrorDetails({ error: error.message, details: error.toString() });
      toast.error("Erro ao processar pagamento");
      setShowPixModal(false);
      setShowCardModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const creditedAmount = user && initialBalance !== null 
    ? (user.account_credit_balance || 0) - initialBalance 
    : 0;

  const canProceedToPayment = paymentMethod && selectedPackage && cpfCnpj.length >= 14 && phone.length >= 14;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Adicionar Crédito</h1>
            <p className="text-slate-400 text-sm mt-1">Aumente seu limite e desbloqueie recursos ilimitados</p>
          </div>
        </div>

        {isFirstTimeBuyer && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-black text-white">Benefícios Exclusivos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FIRST_TIME_BENEFITS.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 bg-slate-800/30 rounded-lg p-4 border border-slate-700/30"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm mb-1">{benefit.title}</h3>
                      <p className="text-slate-400 text-xs leading-relaxed">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {errorDetails && (
          <Card className="bg-red-900/20 border-red-500/50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-400 font-semibold mb-2">Erro ao processar pagamento</h3>
                <p className="text-red-300 text-sm">{errorDetails.error}</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl p-6 md:p-8">
          <div className="space-y-6">
            {/* Passo 1: Escolher método de pagamento */}
            <div className="space-y-4">
              <Label className="text-slate-300 font-semibold flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-emerald-400" />
                Escolha o método de pagamento
              </Label>

              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPaymentMethod('pix')}
                  className={`bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 rounded-xl p-6 transition-all ${
                    paymentMethod === 'pix' 
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
                      : 'border-emerald-500/30 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <QrCode className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-white font-bold text-lg mb-1">Pix</h3>
                      <p className="text-slate-400 text-xs">Instantâneo</p>
                    </div>
                    {paymentMethod === 'pix' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPaymentMethod('credit_card')}
                  className={`bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 rounded-xl p-6 transition-all ${
                    paymentMethod === 'credit_card' 
                      ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                      : 'border-purple-500/30 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-white font-bold text-lg mb-1">Cartão</h3>
                      <p className="text-slate-400 text-xs">Seguro</p>
                    </div>
                    {paymentMethod === 'credit_card' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Passo 2: Preencher dados (aparece após escolher método) */}
            <AnimatePresence>
              {paymentMethod && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-slate-300 font-semibold flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-purple-400" />
                        Pacote de Crédito
                      </Label>
                      <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white h-12">
                          <SelectValue placeholder="Escolha um pacote" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {availablePackages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id} className="text-white">
                              {pkg.name} - {pkg.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-slate-300 font-semibold">CPF/CNPJ</Label>
                      <Input
                        type="text"
                        value={cpfCnpj}
                        onChange={handleCpfCnpjChange}
                        placeholder="000.000.000-00"
                        maxLength={18}
                        className="bg-slate-800/50 border-slate-700 text-white h-12"
                      />
                    </div>

                    <div className="space-y-4 md:col-span-2">
                      <Label className="text-slate-300 font-semibold flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-400" />
                        WhatsApp
                      </Label>
                      <Input
                        type="text"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="bg-slate-800/50 border-slate-700 text-white h-12"
                      />
                    </div>
                  </div>

                  {selectedPackageData && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-slate-400 text-sm">Pacote Selecionado</p>
                          <h3 className="text-white font-bold text-xl">{selectedPackageData.name}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">Valor</p>
                          <p className="text-emerald-400 font-black text-2xl">{selectedPackageData.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <p className="text-slate-300">
                          Aumenta seu limite em <span className="text-emerald-400 font-bold">$ {(selectedPackageData.value * 3).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Botão para confirmar */}
                  <Button
                    onClick={paymentMethod === 'pix' ? handleOpenPixModal : handleOpenCardModal}
                    disabled={!canProceedToPayment}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-14 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentMethod === 'pix' ? (
                      <><QrCode className="w-5 h-5 mr-2" />Continuar com Pix</>
                    ) : (
                      <><CreditCard className="w-5 h-5 mr-2" />Continuar com Cartão</>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Benefícios */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-5"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <InfinityIcon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">Desbloqueie TODAS funções INFINITY PRO</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Comprando créditos você usa agora mesmo todos os recursos sem limite
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">Créditos não expiram</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Garantem todos os benefícios do app, aproveite!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Card>
      </div>

      {/* Pix Modal */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-emerald-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center flex items-center justify-center gap-2">
              <QrCode className="w-6 h-6 text-emerald-400" />
              Pagamento via Pix
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-center">
              {selectedPackageData?.name} - {selectedPackageData?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Pagamento instantâneo via QR Code</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Crédito liberado automaticamente</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Processamento em até 5 segundos</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleConfirmPurchase}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-12 font-bold"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Gerando QR Code...</>
              ) : (
                <><QrCode className="w-5 h-5 mr-2" />Gerar QR Code Pix</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Modal */}
      <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-purple-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center flex items-center justify-center gap-2">
              <CreditCard className="w-6 h-6 text-purple-400" />
              Pagamento com Cartão
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-center">
              {selectedPackageData?.name} - {selectedPackageData?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <CreditCardForm onDataChange={setCreditCardData} cpfCnpj={cpfCnpj} phone={phone} />

            <Button
              onClick={handleConfirmPurchase}
              disabled={isProcessing || !creditCardData}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white h-12 font-bold"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processando...</>
              ) : (
                <><Check className="w-5 h-5 mr-2" />Confirmar Pagamento</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Status Dialog - Eduzz Checkout */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-indigo-500/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          {paymentConfirmed || showSuccessNotification ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-16 h-16 text-white" />
              </motion.div>
              <h3 className="text-2xl font-black text-emerald-400 mb-4">Pagamento Confirmado!</h3>
              <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-4 mb-4">
                <p className="text-slate-300 text-sm mb-2">Créditos Adicionados:</p>
                <p className="text-emerald-400 font-black text-3xl">
                  C$ {creditedAmount.toFixed(2)}
                </p>
              </div>
              <p className="text-slate-400 text-sm mb-2">Saldo atual na conta:</p>
              <p className="text-white font-bold text-xl mb-6">
                C$ {(user?.account_credit_balance || 0).toFixed(2)}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <p className="text-purple-400 text-sm font-semibold">
                  Redirecionando em {countdown}s...
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-center">
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard className="w-6 h-6 text-emerald-400" />
                    Finalizar Pagamento
                  </span>
                </DialogTitle>
                <DialogDescription className="text-slate-300 text-center">
                  {paymentData?.packageInfo?.name} - {paymentData?.packageInfo?.label}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <div id="eduzz-elements" className="min-h-[500px]"></div>
                
                <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-xl p-4 text-center mt-4">
                  <Clock className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                  <p className="text-blue-300 text-sm font-bold">Complete o pagamento acima</p>
                  <p className="text-slate-400 text-xs mt-2">Seus créditos serão liberados automaticamente após a confirmação</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}