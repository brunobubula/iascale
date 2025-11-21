
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Settings, Send, Save, Gift, Activity, AlertTriangle, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for general settings
  const [telegramUrl, setTelegramUrl] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");

  // State for PRO payment URLs
  const [proPaymentUrls, setProPaymentUrls] = useState({
    pro_payment_url_monthly: "",
    pro_payment_url_yearly: "",
    pro_plus_payment_url_monthly: "",
    pro_plus_payment_url_yearly: "",
    infinity_payment_url_monthly: "",
    infinity_payment_url_yearly: ""
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      // The query function just fetches the data, useEffect will set states
      const userData = await base44.auth.me();
      return userData;
    },
  });

  // Effect to populate form states when user data is loaded
  React.useEffect(() => {
    if (user) {
      setTelegramUrl(user.telegram_vip_url || "");
      setAffiliateUrl(user.affiliate_url || "");
      setWhatsappUrl(user.whatsapp_support_url || "");
      setProPaymentUrls({
        pro_payment_url_monthly: user.pro_payment_url_monthly || "",
        pro_payment_url_yearly: user.pro_payment_url_yearly || "",
        pro_plus_payment_url_monthly: user.pro_plus_payment_url_monthly || "",
        pro_plus_payment_url_yearly: user.pro_plus_payment_url_yearly || "",
        infinity_payment_url_monthly: user.infinity_payment_url_monthly || "",
        infinity_payment_url_yearly: user.infinity_payment_url_yearly || ""
      });
    }
  }, [user]);

  // Mutation for general settings (Telegram, Affiliate, WhatsApp)
  const updateSettingsMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      alert("Configurações salvas com sucesso!");
    },
  });

  // Mutation for PRO payment URLs
  const updateProPaymentUrlsMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      alert("URLs de pagamento PRO atualizadas com sucesso!");
    },
  });

  // Submit handler for general settings
  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      telegram_vip_url: telegramUrl,
      affiliate_url: affiliateUrl,
      whatsapp_support_url: whatsappUrl
    });
  };

  // Submit handler for PRO payment URLs
  const handleProPaymentUrlsSubmit = (e) => {
    e.preventDefault();
    updateProPaymentUrlsMutation.mutate(proPaymentUrls);
  };

  // Loading and Access Denied checks
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Access check for admin role
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto text-center py-20">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-slate-400">Apenas administradores podem acessar esta página.</p>
          <Button
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Configurações de Admin
                </h1>
                <p className="text-slate-400 mt-1">Gerencie as configurações do sistema</p>
              </div>
            </div>
          </div>

          {/* General Settings Card */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden shadow-xl mb-8">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Telegram Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800/50">
                  <Send className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Telegram - Sala VIP</h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram_url" className="text-slate-300 font-medium">
                    URL da Sala VIP do Telegram
                  </Label>
                  <Input
                    id="telegram_url"
                    type="url"
                    value={telegramUrl}
                    onChange={(e) => setTelegramUrl(e.target.value)}
                    placeholder="https://t.me/seu_grupo_vip"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Este link será exibido no botão "Abrir SALA VIP" para todos os usuários no Dashboard
                  </p>
                </div>

                {telegramUrl && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-400 text-sm font-medium mb-2">Pré-visualização:</p>
                    <Button
                      type="button"
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                      disabled
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Abrir SALA VIP
                    </Button>
                  </div>
                )}
              </div>

              {/* Affiliate Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800/50">
                  <Gift className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">Programa de Afiliados</h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliate_url" className="text-slate-300 font-medium">
                    URL de Solicitação de Afiliação
                  </Label>
                  <Input
                    id="affiliate_url"
                    type="url"
                    value={affiliateUrl}
                    onChange={(e) => setAffiliateUrl(e.target.value)}
                    placeholder="https://forms.example.com/affiliate"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Este link será usado no botão "Solicitar Afiliação" na página do Programa de Afiliados
                  </p>
                </div>
              </div>

              {/* WhatsApp Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800/50">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl font-bold text-white">WhatsApp - Atendimento</h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_url" className="text-slate-300 font-medium">
                    URL do WhatsApp para Atendimento
                  </Label>
                  <Input
                    id="whatsapp_url"
                    type="url"
                    value={whatsappUrl}
                    onChange={(e) => setWhatsappUrl(e.target.value)}
                    placeholder="https://wa.me/5511999999999"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Este link será usado no botão "Fale com um atendente agora" na página de vendas da iA Trader
                  </p>
                </div>

                {whatsappUrl && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm font-medium mb-2">Pré-visualização:</p>
                    <Button
                      type="button"
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white"
                      disabled
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Fale com um Atendente Agora
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl("Dashboard"))}
                  className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Card de Configurações PRO - URLs de Pagamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur-xl border-yellow-500/30 overflow-hidden shadow-xl mb-8">
              <form onSubmit={handleProPaymentUrlsSubmit} className="p-6">
                <div className="flex items-center gap-3 pb-4 border-b border-yellow-800/50 mb-6">
                  <Activity className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">URLs de Pagamento - Planos PRO</h2>
                    <p className="text-slate-400 text-sm">Configure os links de checkout para cada plano</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Plano PRO */}
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Plano PRO
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="pro_monthly" className="text-slate-300 text-sm mb-2 block">
                          URL Pagamento Mensal (R$49,00/mês)
                        </Label>
                        <Input
                          id="pro_monthly"
                          type="url"
                          value={proPaymentUrls.pro_payment_url_monthly}
                          onChange={(e) => setProPaymentUrls({ ...proPaymentUrls, pro_payment_url_monthly: e.target.value })}
                          placeholder="https://seu-gateway.com/checkout/pro-mensal"
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pro_yearly" className="text-slate-300 text-sm mb-2 block">
                          URL Pagamento Anual (R$388,00/ano - Economize R$200)
                        </Label>
                        <Input
                          id="pro_yearly"
                          type="url"
                          value={proPaymentUrls.pro_payment_url_yearly}
                          onChange={(e) => setProPaymentUrls({ ...proPaymentUrls, pro_payment_url_yearly: e.target.value })}
                          placeholder="https://seu-gateway.com/checkout/pro-anual"
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Plano PRO+ */}
                  <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/30">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      Plano PRO+ (Mais Popular)
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="pro_plus_monthly" className="text-slate-300 text-sm mb-2 block">
                          URL Pagamento Mensal (R$69,00/mês)
                        </Label>
                        <Input
                          id="pro_plus_monthly"
                          type="url"
                          value={proPaymentUrls.pro_plus_payment_url_monthly}
                          onChange={(e) => setProPaymentUrls({ ...proPaymentUrls, pro_plus_payment_url_monthly: e.target.value })}
                          placeholder="https://seu-gateway.com/checkout/pro-plus-mensal"
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pro_plus_yearly" className="text-slate-300 text-sm mb-2 block">
                          URL Pagamento Anual (R$528,00/ano - Economize R$300)
                        </Label>
                        <Input
                          id="pro_plus_yearly"
                          type="url"
                          value={proPaymentUrls.pro_plus_payment_url_yearly}
                          onChange={(e) => setProPaymentUrls({ ...proPaymentUrls, pro_plus_payment_url_yearly: e.target.value })}
                          placeholder="https://seu-gateway.com/checkout/pro-plus-anual"
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Plano INFINITY */}
                  <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 rounded-xl p-4 border border-emerald-500/30">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Plano INFINITY PRO
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="infinity_monthly" className="text-slate-300 text-sm mb-2 block">
                          URL Pagamento Mensal (R$149,00/mês)
                        </Label>
                        <Input
                          id="infinity_monthly"
                          type="url"
                          value={proPaymentUrls.infinity_payment_url_monthly}
                          onChange={(e) => setProPaymentUrls({ ...proPaymentUrls, infinity_payment_url_monthly: e.target.value })}
                          placeholder="https://seu-gateway.com/checkout/infinity-mensal"
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="infinity_yearly" className="text-slate-300 text-sm mb-2 block">
                          URL Pagamento Anual (R$998,00/ano - Economize R$790 SÓ HOJE!)
                        </Label>
                        <Input
                          id="infinity_yearly"
                          type="url"
                          value={proPaymentUrls.infinity_payment_url_yearly}
                          onChange={(e) => setProPaymentUrls({ ...proPaymentUrls, infinity_payment_url_yearly: e.target.value })}
                          placeholder="https://seu-gateway.com/checkout/infinity-anual"
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateProPaymentUrlsMutation.isPending}
                  className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white h-12 text-base font-semibold"
                >
                  {updateProPaymentUrlsMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    "Salvar URLs de Pagamento"
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>

          <div className="mt-6 p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
            <p className="text-slate-400 text-sm">
              💡 <strong className="text-white">Dica:</strong> Certifique-se de que o link do Telegram e o link de afiliação estão corretos e acessíveis antes de salvar.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
