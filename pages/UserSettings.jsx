import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Palette, Bell, Trash2, AlertTriangle, Loader2, Lock, User, Shield, Key, Mail, Eye, EyeOff, Activity, Monitor, Download, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UserSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  const [showPINDialog, setShowPINDialog] = useState(false);
  const [newPIN, setNewPIN] = useState("");
  const [confirmPIN, setConfirmPIN] = useState("");
  const [pinProtectedFeatures, setPinProtectedFeatures] = useState([]);
  
  const [exportingData, setExportingData] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: async () => {
      try {
        return await base44.entities.UserActivityLog.list("-created_date", 20);
      } catch (e) {
        return [];
      }
    },
    enabled: !!user
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['userSessions'],
    queryFn: async () => {
      try {
        return await base44.entities.UserSession.filter({ user_id: user.id, is_active: true });
      } catch (e) {
        return [];
      }
    },
    enabled: !!user
  });

  React.useEffect(() => {
    if (user?.pin_protected_features) {
      setPinProtectedFeatures(user.pin_protected_features);
    }
  }, [user]);

  const toggleThemeMutation = useMutation({
    mutationFn: async (newTheme) => {
      await base44.auth.updateMe({ theme: newTheme });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      alert('✅ Configurações de privacidade atualizadas!');
    }
  });

  const updateNotificationPrefMutation = useMutation({
    mutationFn: async (prefs) => {
      await base44.auth.updateMe({ 
        notification_preferences: prefs 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const toggleNotificationsMutation = useMutation({
    mutationFn: async (enabled) => {
      await base44.auth.updateMe({ notifications_enabled: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const createPINMutation = useMutation({
    mutationFn: async (pin) => {
      await base44.functions.invoke('verifyPIN', { pin, action: 'create' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowPINDialog(false);
      setNewPIN("");
      setConfirmPIN("");
      alert('✅ PIN criado com sucesso!');
    }
  });

  const updatePINFeaturesMutation = useMutation({
    mutationFn: async (features) => {
      await base44.auth.updateMe({ pin_protected_features: features });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const resetDataMutation = useMutation({
    mutationFn: async () => {
      const allTrades = await base44.entities.TradeSignal.filter({ created_by: user.email });
      await Promise.all(allTrades.map(t => base44.entities.TradeSignal.delete(t.id)));
      
      await base44.auth.updateMe({
        initial_balance: 0,
        account_balance: 0,
        notifications_enabled: true,
        theme: "dark",
        ai_trader_uses_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      navigate(createPageUrl("Dashboard"));
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('deleteUserAccount', { 
        confirmText: deleteConfirmText 
      });
    },
    onSuccess: () => {
      base44.auth.logout();
    },
    onError: (error) => {
      alert('❌ Erro ao deletar conta: ' + error.message);
    }
  });

  const handleExportData = async () => {
    setExportingData(true);
    try {
      const response = await base44.functions.invoke('exportUserData');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_data_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      alert('✅ Dados exportados com sucesso!');
    } catch (error) {
      alert('❌ Erro ao exportar dados');
    } finally {
      setExportingData(false);
    }
  };

  const handleCreatePIN = () => {
    if (newPIN.length !== 4 || confirmPIN.length !== 4) {
      alert('❌ PIN deve ter 4 dígitos');
      return;
    }
    if (newPIN !== confirmPIN) {
      alert('❌ Os PINs não coincidem');
      return;
    }
    createPINMutation.mutate(newPIN);
  };

  const handleFeatureToggle = (feature) => {
    const updated = pinProtectedFeatures.includes(feature)
      ? pinProtectedFeatures.filter(f => f !== feature)
      : [...pinProtectedFeatures, feature];
    
    setPinProtectedFeatures(updated);
    updatePINFeaturesMutation.mutate(updated);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const currentTheme = user.theme || "dark";
  const notificationsEnabled = user.notifications_enabled !== false;
  const notifPrefs = user.notification_preferences || {
    trade_alerts: true,
    price_alerts: true,
    news: true,
    promotions: false,
    email_enabled: true,
    push_enabled: true
  };

  const handleNotifPrefChange = (key, value) => {
    updateNotificationPrefMutation.mutate({
      ...notifPrefs,
      [key]: value
    });
  };

  const protectableFeatures = [
    { id: 'ai_trader', label: 'Gerar Trades com iA Trader', icon: '🤖' },
    { id: 'share_trades', label: 'Compartilhar Trades', icon: '📤' },
    { id: 'transfer_balance', label: 'Transferir Saldo', icon: '💸' },
    { id: 'delete_trades', label: 'Deletar Trades', icon: '🗑️' }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold text-white">Preferências</h1>
            <p className="text-slate-400 text-sm mt-1">Personalize sua experiência</p>
          </div>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-slate-900/50 border border-slate-800/50 p-1 mb-6">
            <TabsTrigger value="appearance">
              <Palette className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Aparência</span>
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Eye className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Privacidade</span>
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="account">
              <User className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Conta</span>
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Atividade</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-400" />
                  Tema da Interface
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleThemeMutation.mutate("dark")}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      currentTheme === "dark"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 mb-3 border border-slate-700"></div>
                    <h3 className="text-white font-semibold mb-1">Escuro</h3>
                    <p className="text-slate-400 text-xs">Ideal para ambientes com pouca luz</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleThemeMutation.mutate("light")}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      currentTheme === "light"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 mb-3 border border-gray-300"></div>
                    <h3 className="text-white font-semibold mb-1">Claro</h3>
                    <p className="text-slate-400 text-xs">Melhor para ambientes iluminados</p>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  Configurações de Notificações
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">Notificações Gerais</p>
                      <p className="text-slate-400 text-xs">Ativar/desativar todas as notificações</p>
                    </div>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={(checked) => toggleNotificationsMutation.mutate(checked)}
                    />
                  </div>

                  {notificationsEnabled && (
                    <>
                      <div className="h-px bg-slate-700/30"></div>
                      
                      <div className="space-y-3">
                        <p className="text-slate-400 text-sm font-semibold">Tipos de Notificações:</p>
                        
                        {Object.entries({
                          trade_alerts: { label: '📊 Alertas de Trade', desc: 'TP/SL atingidos, trades fechados' },
                          price_alerts: { label: '💰 Alertas de Preço', desc: 'Variações de preço importantes' },
                          news: { label: '📰 Notícias', desc: 'Atualizações e novidades do mercado' },
                          promotions: { label: '🎁 Promoções', desc: 'Ofertas especiais e descontos' }
                        }).map(([key, info]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
                            <div>
                              <p className="text-white text-sm font-medium">{info.label}</p>
                              <p className="text-slate-400 text-xs">{info.desc}</p>
                            </div>
                            <Switch
                              checked={notifPrefs[key]}
                              onCheckedChange={(v) => handleNotifPrefChange(key, v)}
                            />
                          </div>
                        ))}

                        <div className="h-px bg-slate-700/30 my-4"></div>
                        <p className="text-slate-400 text-sm font-semibold">Canais de Comunicação:</p>
                        
                        <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
                          <div>
                            <p className="text-white text-sm font-medium">📧 Email</p>
                            <p className="text-slate-400 text-xs">Receber notificações por email</p>
                          </div>
                          <Switch
                            checked={notifPrefs.email_enabled}
                            onCheckedChange={(v) => handleNotifPrefChange('email_enabled', v)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
                          <div>
                            <p className="text-white text-sm font-medium">🔔 Push</p>
                            <p className="text-slate-400 text-xs">Notificações push no navegador</p>
                          </div>
                          <Switch
                            checked={notifPrefs.push_enabled}
                            onCheckedChange={(v) => handleNotifPrefChange('push_enabled', v)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="privacy">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  Configurações de Privacidade
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">Aparecer em Rankings</p>
                      <p className="text-slate-400 text-xs">Permitir que seu desempenho apareça em rankings públicos</p>
                    </div>
                    <Switch
                      checked={user.allow_ranking_visibility !== false}
                      onCheckedChange={(checked) => updatePrivacyMutation.mutate({ allow_ranking_visibility: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">Marketing</p>
                      <p className="text-slate-400 text-xs">Receber comunicações de marketing e ofertas</p>
                    </div>
                    <Switch
                      checked={user.marketing_consent || false}
                      onCheckedChange={(checked) => updatePrivacyMutation.mutate({ marketing_consent: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">Analytics Anônimos</p>
                      <p className="text-slate-400 text-xs">Permitir uso de dados anonimizados para melhorias do sistema</p>
                    </div>
                    <Switch
                      checked={user.data_analytics_consent !== false}
                      onCheckedChange={(checked) => updatePrivacyMutation.mutate({ data_analytics_consent: checked })}
                    />
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-purple-400" />
                  Exportação de Dados (LGPD)
                </h2>

                <p className="text-slate-300 text-sm mb-4">
                  Você tem o direito de exportar todos os seus dados pessoais e de atividade armazenados na plataforma.
                </p>

                <Button
                  onClick={handleExportData}
                  disabled={exportingData}
                  variant="outline"
                  className="w-full bg-purple-500/10 border-purple-500/50 hover:bg-purple-500/20 text-purple-400"
                >
                  {exportingData ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {exportingData ? 'Exportando...' : 'Exportar Meus Dados'}
                </Button>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="security">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-400" />
                  Autenticação de Dois Fatores (2FA)
                </h2>

                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-300 text-sm mb-3">
                      💡 A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                        <div>
                          <p className="text-white font-semibold">Status 2FA</p>
                          <p className="text-slate-400 text-xs">
                            {user.two_factor_enabled ? 'Ativado' : 'Desativado'}
                          </p>
                        </div>
                        <Switch
                          checked={user.two_factor_enabled || false}
                          disabled
                        />
                      </div>

                      {user.two_factor_enabled && user.two_factor_method && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                          <p className="text-emerald-400 text-sm flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Método ativo: {user.two_factor_method === 'email' ? 'Email' : user.two_factor_method === 'sms' ? 'SMS' : 'Authenticator'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-300 text-xs">
                      🚧 Funcionalidade em desenvolvimento. Em breve você poderá ativar 2FA via Email, SMS ou App Autenticador.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  PIN de Segurança
                </h2>

                {!user.pin_code_hashed ? (
                  <div className="space-y-4">
                    <p className="text-slate-300 text-sm">
                      Crie um PIN de 4 dígitos para proteger funções importantes do app.
                    </p>
                    <Button
                      onClick={() => setShowPINDialog(true)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Criar PIN de Segurança
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                      <p className="text-emerald-400 text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        PIN de segurança ativo
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-300 text-sm font-semibold mb-3">
                        Funções Protegidas por PIN:
                      </p>
                      <div className="space-y-2">
                        {protectableFeatures.map(feature => (
                          <div key={feature.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                            <Checkbox
                              checked={pinProtectedFeatures.includes(feature.id)}
                              onCheckedChange={() => handleFeatureToggle(feature.id)}
                            />
                            <span className="text-lg">{feature.icon}</span>
                            <span className="text-white text-sm flex-1">{feature.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-400" />
                  Alterar Credenciais
                </h2>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white justify-start"
                    disabled
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Trocar Senha
                    <span className="ml-auto text-xs text-slate-500">Em breve</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white justify-start"
                    disabled
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Trocar Email
                    <span className="ml-auto text-xs text-slate-500">Em breve</span>
                  </Button>
                </div>

                <p className="text-slate-500 text-xs mt-4">
                  💡 Em breve você poderá alterar sua senha e email diretamente pelo app.
                </p>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="account">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Informações da Conta
                </h2>

                <div className="space-y-3">
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Email</p>
                    <p className="text-white font-semibold">{user.email}</p>
                  </div>
                  
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Nome Completo</p>
                    <p className="text-white font-semibold">{user.full_name || 'Não definido'}</p>
                  </div>

                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Nickname</p>
                    <p className="text-white font-semibold">{user.nickname || 'Não definido'}</p>
                  </div>

                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Plano Atual</p>
                    <p className="text-white font-semibold">
                      {user.is_pro ? user.pro_plan_type?.toUpperCase() : 'FREE'}
                    </p>
                  </div>

                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Perfil Completo</p>
                    <p className={`font-semibold ${user.profile_completed ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {user.profile_completed ? '✅ Sim' : '⚠️ Não'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-red-900/20 border-red-500/50 p-6">
                <h2 className="text-red-400 font-bold text-lg mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Zona de Perigo
                </h2>
                <p className="text-slate-300 text-sm mb-6">
                  Ações irreversíveis que afetam permanentemente sua conta.
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={() => setShowResetDialog(true)}
                    variant="outline"
                    className="w-full bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20 text-orange-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Resetar Todos os Dados
                  </Button>

                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="outline"
                    className="w-full bg-red-500/10 border-red-500/50 hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Encerrar Conta Permanentemente
                  </Button>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="activity">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Registro de Atividades
                </h2>

                {activityLogs.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {activityLogs.map((log, idx) => (
                      <div key={idx} className="bg-slate-800/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-sm font-semibold">
                            {log.activity_type?.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {new Date(log.created_date).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">{log.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm text-center py-8">
                    Nenhuma atividade registrada ainda
                  </p>
                )}
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-400" />
                  Dispositivos Conectados
                </h2>

                <p className="text-slate-400 text-sm mb-4">
                  Em breve você poderá gerenciar suas sessões e dispositivos ativos.
                </p>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-300 text-xs">
                    💡 Este recurso está em desenvolvimento
                  </p>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showPINDialog} onOpenChange={setShowPINDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Criar PIN de Segurança
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Crie um PIN de 4 dígitos para proteger funções importantes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300 mb-2 block">Novo PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPIN}
                onChange={(e) => setNewPIN(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Confirmar PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPIN}
                onChange={(e) => setConfirmPIN(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPINDialog(false);
                setNewPIN("");
                setConfirmPIN("");
              }}
              className="bg-slate-800 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePIN}
              disabled={createPINMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {createPINMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                "Criar PIN"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="w-6 h-6" />
              Confirmar Reset Total
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Esta ação é IRREVERSÍVEL e deletará permanentemente:
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li>Todos os seus trades</li>
                <li>Histórico de performance</li>
                <li>Configurações personalizadas</li>
                <li>Saldo simulado</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <Label className="text-slate-300 mb-2">
              Digite <span className="font-bold text-orange-400">RESETAR</span> para confirmar:
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESETAR"
              className="bg-slate-800/50 border-slate-700 text-white mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmText === "RESETAR") {
                  resetDataMutation.mutate();
                  setShowResetDialog(false);
                  setConfirmText("");
                }
              }}
              disabled={confirmText !== "RESETAR" || resetDataMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {resetDataMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Confirmar Reset
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              Encerrar Conta Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Esta ação é IRREVERSÍVEL e deletará:
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li>TODOS os seus dados pessoais</li>
                <li>TODOS os seus trades e histórico</li>
                <li>TODOS os registros de atividade</li>
                <li>Sua conta será PERMANENTEMENTE removida</li>
              </ul>
              <br />
              <span className="text-red-400 font-bold">Esta ação NÃO pode ser desfeita!</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <Label className="text-slate-300 mb-2">
              Digite <span className="font-bold text-red-400">DELETAR MINHA CONTA</span> para confirmar:
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETAR MINHA CONTA"
              className="bg-slate-800/50 border-slate-700 text-white mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmText === "DELETAR MINHA CONTA") {
                  deleteAccountMutation.mutate();
                }
              }}
              disabled={deleteConfirmText !== "DELETAR MINHA CONTA" || deleteAccountMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar Conta
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}