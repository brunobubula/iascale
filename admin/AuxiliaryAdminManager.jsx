import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Shield, Eye, EyeOff, Trash2, Lock, MessageSquare, Activity, Mail, Phone, Search, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PROFILE_PRESETS = {
  support: {
    name: "Suporte",
    permissions: {
      view_users: true,
      view_tickets: true,
      respond_tickets: true,
      send_notifications: true,
      view_analytics: false,
      manage_users: false,
      manage_credits: false,
      activate_plans: false,
      view_sales: false,
      manage_sales: false,
      view_audit_logs: false,
      manage_data_collection: false,
      view_team: false,
      manage_content: false
    }
  },
  sales: {
    name: "Vendas",
    permissions: {
      view_users: true,
      view_sales: true,
      manage_sales: true,
      send_notifications: true,
      view_analytics: true,
      activate_plans: true,
      manage_credits: true,
      view_tickets: false,
      respond_tickets: false,
      manage_users: false,
      view_audit_logs: false,
      manage_data_collection: false,
      view_team: false,
      manage_content: false
    }
  },
  commercial: {
    name: "Comercial",
    permissions: {
      view_users: true,
      view_sales: true,
      manage_sales: true,
      view_analytics: true,
      send_notifications: true,
      activate_plans: true,
      manage_credits: true,
      view_tickets: true,
      respond_tickets: false,
      manage_users: false,
      view_audit_logs: false,
      manage_data_collection: false,
      view_team: true,
      manage_content: false
    }
  },
  technical: {
    name: "Técnico",
    permissions: {
      view_users: true,
      manage_data_collection: true,
      view_audit_logs: true,
      view_tickets: true,
      respond_tickets: true,
      view_analytics: true,
      send_notifications: false,
      manage_users: false,
      manage_credits: false,
      activate_plans: false,
      view_sales: false,
      manage_sales: false,
      view_team: false,
      manage_content: false
    }
  },
  marketing: {
    name: "Marketing",
    permissions: {
      view_analytics: true,
      send_notifications: true,
      view_users: true,
      manage_content: true,
      view_sales: true,
      view_team: true,
      view_tickets: false,
      respond_tickets: false,
      manage_users: false,
      manage_credits: false,
      activate_plans: false,
      manage_sales: false,
      view_audit_logs: false,
      manage_data_collection: false
    }
  },
  communication: {
    name: "Comunicação",
    permissions: {
      send_notifications: true,
      view_tickets: true,
      respond_tickets: true,
      view_users: true,
      manage_content: true,
      view_analytics: false,
      manage_users: false,
      manage_credits: false,
      activate_plans: false,
      view_sales: false,
      manage_sales: false,
      view_audit_logs: false,
      manage_data_collection: false,
      view_team: false
    }
  },
  content_creation: {
    name: "Criação de Conteúdo",
    permissions: {
      manage_content: true,
      view_analytics: true,
      send_notifications: true,
      view_users: false,
      view_tickets: false,
      respond_tickets: false,
      manage_users: false,
      manage_credits: false,
      activate_plans: false,
      view_sales: false,
      manage_sales: false,
      view_audit_logs: false,
      manage_data_collection: false,
      view_team: false
    }
  },
  supervision: {
    name: "Supervisão",
    permissions: {
      view_users: true,
      view_tickets: true,
      respond_tickets: true,
      view_sales: true,
      view_analytics: true,
      view_audit_logs: true,
      view_team: true,
      send_notifications: true,
      manage_users: false,
      manage_credits: false,
      activate_plans: false,
      manage_sales: false,
      manage_data_collection: false,
      manage_content: false
    }
  }
};

export default function AuxiliaryAdminManager({ masterUser, allUsers = [] }) {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMessagesDialog, setShowMessagesDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileType, setProfileType] = useState("support");
  const [customPermissions, setCustomPermissions] = useState({});
  const [messageText, setMessageText] = useState("");

  const { data: auxiliaryAdminsData = [] } = useQuery({
    queryKey: ['auxiliaryAdmins'],
    queryFn: () => base44.asServiceRole.entities.AuxiliaryAdmin.list("-created_date"),
    refetchInterval: 10000
  });

  const auxiliaryAdmins = Array.isArray(auxiliaryAdminsData) ? auxiliaryAdminsData : [];

  const { data: logsData = [] } = useQuery({
    queryKey: ['auxiliaryAdminLogs'],
    queryFn: () => base44.asServiceRole.entities.AuxiliaryAdminLog.list("-created_date", 100),
    enabled: !!selectedAdmin
  });

  const filteredUsers = allUsers.filter(u => 
    u?.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u?.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  ).slice(0, 5);

  const validateUserForAdmin = (user) => {
    const errors = [];
    
    if (user?.is_blocked) {
      errors.push("Usuário está bloqueado");
    }
    
    if (!user?.full_name || user.full_name.length < 3) {
      errors.push("Nome completo não preenchido");
    }
    
    if (!user?.email) {
      errors.push("Email não verificado");
    }
    
    if ((user?.account_credit_balance || 0) < 0) {
      errors.push("Saldo de créditos negativo");
    }
    
    return errors;
  };

  const createAdminMutation = useMutation({
    mutationFn: async () => {
      const password = Math.random().toString(36).substring(2, 8).toUpperCase();
      const permissions = profileType === 'custom' ? customPermissions : PROFILE_PRESETS[profileType].permissions;
      
      const newAdmin = await base44.asServiceRole.entities.AuxiliaryAdmin.create({
        email,
        full_name: fullName,
        phone,
        access_password: password,
        profile_type: profileType,
        permissions,
        is_active: true,
        created_by_master: masterUser?.email,
        total_logins: 0
      });

      // Enviar notificação
      await base44.functions.invoke('createNotification', {
        userEmail: email,
        title: "Você foi adicionado como Admin Auxiliar!",
        message: `Bem-vindo à equipe! Acesse o painel Admin Auxiliar com a senha: ${password}`,
        type: 'system',
        iconName: 'Shield',
        priority: 'high'
      });

      return newAdmin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auxiliaryAdmins'] });
      setShowCreateDialog(false);
      setEmail("");
      setFullName("");
      setPhone("");
      setSelectedUser(null);
      setUserSearch("");
      alert("✅ Admin criado! Credenciais enviadas por notificação.");
    }
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async (admin) => {
      return await base44.asServiceRole.entities.AuxiliaryAdmin.update(admin.id, {
        is_blocked: !admin.is_blocked,
        block_reason: admin.is_blocked ? null : "Bloqueado pelo Admin Master"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auxiliaryAdmins'] });
    }
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId) => {
      return await base44.asServiceRole.entities.AuxiliaryAdmin.delete(adminId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auxiliaryAdmins'] });
      setShowDetailsDialog(false);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      await base44.asServiceRole.entities.AdminMessage.create({
        from_email: masterUser.email,
        to_email: selectedAdmin.email,
        message: messageText,
        from_master: true
      });

      await base44.functions.invoke('createNotification', {
        userEmail: selectedAdmin.email,
        title: "Nova mensagem do Admin Master",
        message: messageText.substring(0, 100),
        type: 'system',
        iconName: 'MessageSquare',
        priority: 'high'
      });
    },
    onSuccess: () => {
      setMessageText("");
      alert("✅ Mensagem enviada!");
    }
  });

  const handleSelectUser = (user) => {
    const errors = validateUserForAdmin(user);
    
    if (errors.length > 0) {
      alert("❌ Usuário não pode ser promovido:\n\n" + errors.join("\n"));
      return;
    }
    
    setSelectedUser(user);
    setEmail(user.email);
    setFullName(user.full_name || "");
    setPhone(user.phone || "");
  };

  const selectedAdminLogs = logsData.filter(log => log?.admin_email === selectedAdmin?.email);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-400" />
            Administradores Auxiliares ({auxiliaryAdmins.length})
          </h3>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Criar Admin
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auxiliaryAdmins.map((admin) => (
            <motion.div
              key={admin?.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card 
                className={`p-4 cursor-pointer transition-all ${
                  admin?.is_blocked 
                    ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
                    : 'bg-slate-800/30 border-slate-700/50 hover:border-blue-500/50'
                }`}
                onClick={() => {
                  setSelectedAdmin(admin);
                  setShowDetailsDialog(true);
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                    {admin?.full_name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm truncate">{admin?.full_name}</div>
                    <div className="text-slate-400 text-xs truncate">{admin?.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-xs">
                    {PROFILE_PRESETS[admin?.profile_type]?.name || admin?.profile_type}
                  </Badge>
                  {admin?.is_blocked && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-xs">
                      Bloqueado
                    </Badge>
                  )}
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  {admin?.total_logins || 0} logins
                  {admin?.last_login && ` • ${format(new Date(admin.last_login), "dd/MM HH:mm", { locale: ptBR })}`}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Dialog: Criar Admin */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-yellow-400" />
              Criar Administrador Auxiliar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Busca de Usuário */}
            <div>
              <Label className="text-slate-300 mb-2">Buscar Usuário do App</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Digite email ou nome..."
                  className="bg-slate-800/50 border-slate-700 text-white pl-10"
                />
              </div>
              
              {userSearch && filteredUsers.length > 0 && (
                <div className="mt-2 bg-slate-800/50 border border-slate-700 rounded-lg max-h-40 overflow-y-auto">
                  {filteredUsers.map(user => {
                    const errors = validateUserForAdmin(user);
                    const hasErrors = errors.length > 0;
                    
                    return (
                      <div
                        key={user?.id}
                        onClick={() => !hasErrors && handleSelectUser(user)}
                        className={`p-3 cursor-pointer transition-colors ${
                          hasErrors 
                            ? 'opacity-50 cursor-not-allowed bg-red-500/10'
                            : 'hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white text-sm font-semibold">{user?.full_name || user?.email}</div>
                            <div className="text-slate-400 text-xs">{user?.email}</div>
                          </div>
                          {hasErrors && (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        {hasErrors && (
                          <div className="text-red-400 text-xs mt-1">
                            {errors[0]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {selectedUser && (
                <div className="mt-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  <div className="text-emerald-400 text-sm font-semibold flex items-center gap-2">
                    ✓ {selectedUser.full_name}
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setEmail("");
                        setFullName("");
                        setPhone("");
                        setUserSearch("");
                      }}
                      className="text-slate-400 hover:text-white text-xs ml-auto"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 mb-2">Nome Completo</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="João Silva"
                  className="bg-slate-800/50 border-slate-700 text-white"
                  disabled={!!selectedUser}
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-2">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  className="bg-slate-800/50 border-slate-700 text-white"
                  disabled={!!selectedUser}
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300 mb-2">Telefone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2">Perfil de Acesso</Label>
              <Select value={profileType} onValueChange={setProfileType}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.entries(PROFILE_PRESETS).map(([key, preset]) => (
                    <SelectItem key={key} value={key} className="text-white">
                      {preset.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-white">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {profileType === 'custom' && (
              <div className="bg-slate-800/30 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                <Label className="text-slate-300 mb-2">Permissões Personalizadas</Label>
                {Object.keys(PROFILE_PRESETS.support.permissions).map(perm => (
                  <div key={perm} className="flex items-center gap-2">
                    <Checkbox
                      checked={customPermissions[perm] || false}
                      onCheckedChange={(checked) => setCustomPermissions({...customPermissions, [perm]: checked})}
                    />
                    <label className="text-slate-300 text-sm">
                      {perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-blue-300 text-xs">
                🔐 Uma senha será gerada automaticamente e enviada por notificação para o email do admin.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setSelectedUser(null);
                setUserSearch("");
              }}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createAdminMutation.mutate()}
              disabled={!email || !fullName || createAdminMutation.isPending}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Criar Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes/Gerenciar */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedAdmin && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  {selectedAdmin.full_name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Info Básica */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </div>
                    <div className="text-white text-sm font-semibold">{selectedAdmin.email}</div>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Telefone
                    </div>
                    <div className="text-white text-sm font-semibold">{selectedAdmin.phone || 'Não informado'}</div>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1">Perfil</div>
                    <div className="text-white text-sm font-semibold">
                      {PROFILE_PRESETS[selectedAdmin.profile_type]?.name || selectedAdmin.profile_type}
                    </div>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Senha
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-mono">
                        {showPassword[selectedAdmin.id] ? selectedAdmin.access_password : '••••••'}
                      </span>
                      <button
                        onClick={() => setShowPassword({...showPassword, [selectedAdmin.id]: !showPassword[selectedAdmin.id]})}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        {showPassword[selectedAdmin.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Permissões */}
                <Card className="bg-slate-800/30 border-slate-700/50 p-4">
                  <h4 className="text-white font-bold mb-3 text-sm">Permissões</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(selectedAdmin.permissions || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${value ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        <span className={value ? 'text-slate-300' : 'text-slate-500'}>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Logs de Atividade */}
                <Card className="bg-slate-800/30 border-slate-700/50 p-4">
                  <h4 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Últimas Atividades
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {selectedAdminLogs.slice(0, 10).map((log) => (
                      <div key={log?.id} className="text-xs text-slate-400 flex items-center justify-between gap-2 py-1">
                        <span>{log?.action_type} - {log?.page_visited || 'N/A'}</span>
                        <span className="text-slate-500">{format(new Date(log?.created_date), "dd/MM HH:mm", { locale: ptBR })}</span>
                      </div>
                    ))}
                    {selectedAdminLogs.length === 0 && (
                      <div className="text-center text-slate-500 py-3">Nenhuma atividade registrada</div>
                    )}
                  </div>
                </Card>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowMessagesDialog(true)}
                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enviar Mensagem
                  </Button>
                  <Button
                    onClick={() => toggleBlockMutation.mutate(selectedAdmin)}
                    className={`flex-1 ${
                      selectedAdmin.is_blocked
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400'
                        : 'bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-400'
                    }`}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {selectedAdmin.is_blocked ? 'Desbloquear' : 'Bloquear'}
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm(`Deletar admin ${selectedAdmin.full_name}?`)) {
                        deleteAdminMutation.mutate(selectedAdmin.id);
                      }
                    }}
                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Mensagem */}
      <Dialog open={showMessagesDialog} onOpenChange={setShowMessagesDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              Mensagem para {selectedAdmin?.full_name}
            </DialogTitle>
          </DialogHeader>

          <div>
            <Label className="text-slate-300 mb-2">Mensagem</Label>
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMessagesDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => sendMessageMutation.mutate()}
              disabled={!messageText || sendMessageMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}