import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  Wallet, 
  Crown, 
  Send, 
  Gift, 
  Loader2, 
  CheckCircle, 
  Copy, 
  Plus, 
  Users,
  Trash2,
  Mail,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const BLOCK_TYPES = [
  { value: 'total', label: 'Bloqueio Total', description: 'Usuário perde acesso completo' },
  { value: 'ai_trader', label: 'Bloquear iA Trader', description: 'Impede uso da iA Trader' },
  { value: 'futures_scale', label: 'Bloquear Futuros Scale', description: 'Impede acesso aos futuros' },
  { value: 'credit_purchase', label: 'Bloquear Compra de Créditos', description: 'Impede adicionar créditos' },
  { value: 'trade_creation', label: 'Bloquear Criação de Trades', description: 'Impede criar novos trades' }
];

const PLAN_TYPES = [
  { value: 'free', label: 'FREE' },
  { value: 'pro', label: 'PRO' },
  { value: 'pro_plus', label: 'PRO+' },
  { value: 'infinity_pro', label: 'INFINITY PRO' },
  { value: 'enterprise', label: 'ENTERPRISE' }
];

export default function UserManagementPanel({ allUsers = [] }) {
  const queryClient = useQueryClient();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [showBulkActionsDialog, setShowBulkActionsDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  
  const [blockType, setBlockType] = useState('total');
  const [blockReason, setBlockReason] = useState('');
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditReason, setCreditReason] = useState('');
  const [planType, setPlanType] = useState('pro');
  const [planDuration, setPlanDuration] = useState(30);
  const [planReason, setPlanReason] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('system');
  const [couponCode, setCouponCode] = useState('');
  const [couponPlan, setCouponPlan] = useState('pro');
  const [couponDays, setCouponDays] = useState(30);
  const [couponMaxUses, setCouponMaxUses] = useState(1);
  const [generatedCoupon, setGeneratedCoupon] = useState(null);

  const validUsers = Array.isArray(allUsers) ? allUsers : [];
  const filteredUsers = validUsers.filter(u => 
    u?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u?.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers([...filteredUsers]);
    }
  };

  const blockUserMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('manageUserBlock', {
        userId: selectedUser.id,
        action: selectedUser.is_blocked ? 'unblock' : 'block',
        blockType,
        reason: blockReason
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setShowBlockDialog(false);
      toast.success(selectedUser.is_blocked ? 'Usuário desbloqueado!' : 'Usuário bloqueado!');
      setBlockReason('');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const adjustCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('adjustUserCredits', {
        userId: selectedUser.id,
        amount: parseFloat(creditAmount),
        reason: creditReason
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setShowCreditDialog(false);
      toast.success('Créditos ajustados com sucesso!');
      setCreditAmount(0);
      setCreditReason('');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const activatePlanMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('activateUserPlan', {
        userId: selectedUser.id,
        planType,
        durationDays: parseInt(planDuration),
        reason: planReason
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setShowPlanDialog(false);
      toast.success('Plano ativado com sucesso!');
      setPlanReason('');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('createNotification', {
        userId: selectedUser.id,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        iconName: 'Bell',
        priority: 'high'
      });
      return response.data;
    },
    onSuccess: () => {
      setShowNotificationDialog(false);
      toast.success('Notificação enviada!');
      setNotifTitle('');
      setNotifMessage('');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const createCouponMutation = useMutation({
    mutationFn: async () => {
      const expirationDate = addDays(new Date(), 90).toISOString();
      
      const coupon = await base44.entities.DiscountCoupon.create({
        code: couponCode.toUpperCase(),
        plan_type: couponPlan,
        duration_days: parseInt(couponDays),
        max_uses: parseInt(couponMaxUses),
        current_uses: 0,
        is_active: true,
        created_by_admin: user.email,
        expires_at: expirationDate,
        description: `Cupom para ativar ${couponPlan.toUpperCase()} por ${couponDays} dias`
      });
      
      return coupon;
    },
    onSuccess: (coupon) => {
      setGeneratedCoupon(coupon);
      toast.success('Cupom criado com sucesso!');
      setCouponCode('');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const bulkActionMutation = useMutation({
    mutationFn: async (action) => {
      const userIds = selectedUsers.map(u => u.id);
      const response = await base44.functions.invoke('bulkUserActions', {
        userIds,
        action,
        params: {
          planType: planType,
          durationDays: parseInt(planDuration),
          creditAmount: parseFloat(creditAmount),
          notifTitle,
          notifMessage,
          notifType
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setShowBulkActionsDialog(false);
      setSelectedUsers([]);
      toast.success('Ação em massa executada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Gerenciamento de Usuários
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {validUsers.length} usuários cadastrados
            </p>
          </div>
          
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-lg px-4 py-2">
                {selectedUsers.length} selecionados
              </Badge>
              <Button
                onClick={() => setShowBulkActionsDialog(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
              >
                <Zap className="w-4 h-4 mr-2" />
                Ações em Massa
              </Button>
            </div>
          )}
        </div>
        
        <Input
          placeholder="Buscar por email ou nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-800/50 border-slate-700 text-white mb-4"
        />

        <div className="flex items-center gap-2 mb-4">
          <Button
            onClick={handleSelectAll}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-700 text-white"
          >
            <CheckCircle className="w-3 h-3 mr-2" />
            {selectedUsers.length === filteredUsers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </Button>
          {selectedUsers.length > 0 && (
            <Button
              onClick={() => setSelectedUsers([])}
              variant="outline"
              size="sm"
              className="bg-red-500/20 border-red-500/50 text-red-400"
            >
              Limpar Seleção
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <motion.div
                key={user.id}
                whileHover={{ scale: 1.005 }}
                className={`p-4 rounded-lg cursor-pointer transition-all border ${
                  selectedUsers.find(u => u.id === user.id)
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={!!selectedUsers.find(u => u.id === user.id)}
                    onCheckedChange={() => handleSelectUser(user)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold text-sm">{user.email}</p>
                      {user.is_blocked && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                          Bloqueado
                        </Badge>
                      )}
                      {user.is_pro && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                          {user.pro_plan_type?.toUpperCase() || 'PRO'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{user.full_name || 'Nome não definido'}</span>
                      {user.account_credit_balance > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">C$ {user.account_credit_balance.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(user);
                    }}
                    size="sm"
                    variant="outline"
                    className="bg-slate-800/50 border-slate-700 text-white"
                  >
                    Gerenciar
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50 p-6">
            <h3 className="text-white font-bold text-lg mb-4">
              Ações Individuais: {selectedUser.email}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              <Button
                onClick={() => setShowBlockDialog(true)}
                className={`${
                  selectedUser.is_blocked
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 text-emerald-400'
                    : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400'
                } border h-auto py-4`}
              >
                {selectedUser.is_blocked ? (
                  <>
                    <UserCheck className="w-5 h-5 mr-2" />
                    Desbloquear
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 mr-2" />
                    Bloquear
                  </>
                )}
              </Button>

              <Button
                onClick={() => setShowCreditDialog(true)}
                className="bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50 text-blue-400 border h-auto py-4"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Ajustar Créditos
              </Button>

              <Button
                onClick={() => setShowPlanDialog(true)}
                className="bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/50 text-purple-400 border h-auto py-4"
              >
                <Crown className="w-5 h-5 mr-2" />
                Ativar Plano
              </Button>

              <Button
                onClick={() => setShowNotificationDialog(true)}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/50 text-yellow-400 border h-auto py-4"
              >
                <Send className="w-5 h-5 mr-2" />
                Notificação
              </Button>

              <Button
                onClick={() => setShowCouponDialog(true)}
                className="bg-pink-500/20 hover:bg-pink-500/30 border-pink-500/50 text-pink-400 border h-auto py-4"
              >
                <Gift className="w-5 h-5 mr-2" />
                Gerar Cupom
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Créditos</p>
                <p className="text-white font-bold">C$ {(selectedUser.account_credit_balance || 0).toFixed(2)}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Plano</p>
                <p className="text-white font-bold">{selectedUser.pro_plan_type?.toUpperCase() || 'FREE'}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Status</p>
                <p className={`font-bold ${selectedUser.is_blocked ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedUser.is_blocked ? 'Bloqueado' : 'Ativo'}
                </p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Limite USD</p>
                <p className="text-white font-bold">$ {((selectedUser.balance_limit_usd || 2000)).toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Bulk Actions Dialog */}
      <Dialog open={showBulkActionsDialog} onOpenChange={setShowBulkActionsDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-400" />
              Ações em Massa ({selectedUsers.length} usuários)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2">Escolha a ação:</Label>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione uma ação" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="activate_plan" className="text-white">Ativar Plano</SelectItem>
                  <SelectItem value="add_credits" className="text-white">Adicionar Créditos</SelectItem>
                  <SelectItem value="send_notification" className="text-white">Enviar Notificação</SelectItem>
                  <SelectItem value="block_users" className="text-white text-red-400">Bloquear Usuários</SelectItem>
                  <SelectItem value="delete_users" className="text-white text-red-400">Deletar Usuários</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkAction === 'activate_plan' && (
              <>
                <div>
                  <Label className="text-slate-300 mb-2">Plano</Label>
                  <Select value={planType} onValueChange={setPlanType}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {PLAN_TYPES.map(p => (
                        <SelectItem key={p.value} value={p.value} className="text-white">{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 mb-2">Duração (dias)</Label>
                  <Input
                    type="number"
                    value={planDuration}
                    onChange={(e) => setPlanDuration(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </>
            )}

            {bulkAction === 'add_credits' && (
              <div>
                <Label className="text-slate-300 mb-2">Créditos a Adicionar</Label>
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            )}

            {bulkAction === 'send_notification' && (
              <>
                <div>
                  <Label className="text-slate-300 mb-2">Título</Label>
                  <Input
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 mb-2">Mensagem</Label>
                  <Textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </>
            )}

            {(bulkAction === 'block_users' || bulkAction === 'delete_users') && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm font-bold">
                  ⚠️ Atenção: Esta ação afetará {selectedUsers.length} usuários!
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkActionsDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => bulkActionMutation.mutate(bulkAction)}
              disabled={!bulkAction || bulkActionMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {bulkActionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Executar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Existing dialogs */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-400" />
              {selectedUser?.is_blocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {!selectedUser?.is_blocked && (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-2">Tipo de Bloqueio</Label>
                <Select value={blockType} onValueChange={setBlockType}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {BLOCK_TYPES.map(bt => (
                      <SelectItem key={bt.value} value={bt.value} className="text-white">
                        {bt.label} - {bt.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300 mb-2">Motivo do Bloqueio</Label>
                <Textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Tentativa de fraude, violação dos termos..."
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
          )}

          {selectedUser?.is_blocked && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <p className="text-emerald-400 text-sm">
                Este usuário está bloqueado. Deseja desbloqueá-lo e restaurar acesso total?
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBlockDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => blockUserMutation.mutate()}
              disabled={blockUserMutation.isPending || (!selectedUser?.is_blocked && !blockReason)}
              className={selectedUser?.is_blocked 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
              }
            >
              {blockUserMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : selectedUser?.is_blocked ? (
                <UserCheck className="w-4 h-4 mr-2" />
              ) : (
                <UserX className="w-4 h-4 mr-2" />
              )}
              {selectedUser?.is_blocked ? 'Desbloquear' : 'Bloquear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blue-400" />
              Ajustar Créditos
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Saldo atual: C$ {(selectedUser?.account_credit_balance || 0).toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2">Valor a Adicionar/Remover (C$)</Label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Ex: 100 ou -50"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
              <p className="text-slate-500 text-xs mt-1">
                Novo saldo: C$ {((selectedUser?.account_credit_balance || 0) + parseFloat(creditAmount || 0)).toFixed(2)}
              </p>
            </div>

            <div>
              <Label className="text-slate-300 mb-2">Motivo do Ajuste</Label>
              <Textarea
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="Ex: Compensação por erro, bônus promocional..."
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreditDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => adjustCreditsMutation.mutate()}
              disabled={adjustCreditsMutation.isPending || !creditAmount || !creditReason}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {adjustCreditsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Wallet className="w-4 h-4 mr-2" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-purple-400" />
              Ativar Plano Manualmente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2">Tipo de Plano</Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PLAN_TYPES.map(plan => (
                    <SelectItem key={plan.value} value={plan.value} className="text-white">
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300 mb-2">Duração (dias)</Label>
              <Input
                type="number"
                value={planDuration}
                onChange={(e) => setPlanDuration(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
              <p className="text-slate-500 text-xs mt-1">
                Expira em: {format(addDays(new Date(), parseInt(planDuration)), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>

            <div>
              <Label className="text-slate-300 mb-2">Motivo</Label>
              <Textarea
                value={planReason}
                onChange={(e) => setPlanReason(e.target.value)}
                placeholder="Ex: Promoção especial..."
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPlanDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => activatePlanMutation.mutate()}
              disabled={activatePlanMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {activatePlanMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              Ativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-6 h-6 text-yellow-400" />
              Enviar Notificação
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2">Título</Label>
              <Input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Ex: Importante: Atualize seus dados"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2">Mensagem</Label>
              <Textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="Conteúdo da notificação..."
                className="bg-slate-800/50 border-slate-700 text-white h-24"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2">Tipo</Label>
              <Select value={notifType} onValueChange={setNotifType}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="system" className="text-white">Sistema</SelectItem>
                  <SelectItem value="alert" className="text-white">Alerta</SelectItem>
                  <SelectItem value="critical" className="text-white">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotificationDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => sendNotificationMutation.mutate()}
              disabled={sendNotificationMutation.isPending || !notifTitle || !notifMessage}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {sendNotificationMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-6 h-6 text-pink-400" />
              Gerar Cupom de Desconto
            </DialogTitle>
          </DialogHeader>

          {!generatedCoupon ? (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-2">Código do Cupom</Label>
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Ex: PROMO2024"
                  className="bg-slate-800/50 border-slate-700 text-white uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 mb-2">Plano</Label>
                  <Select value={couponPlan} onValueChange={setCouponPlan}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {PLAN_TYPES.map(plan => (
                        <SelectItem key={plan.value} value={plan.value} className="text-white">
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2">Dias</Label>
                  <Input
                    type="number"
                    value={couponDays}
                    onChange={(e) => setCouponDays(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300 mb-2">Máximo de Usos</Label>
                <Input
                  type="number"
                  value={couponMaxUses}
                  onChange={(e) => setCouponMaxUses(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-emerald-400 font-bold text-lg mb-2">Cupom Criado!</p>
                <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                  <p className="text-white text-2xl font-black">{generatedCoupon.code}</p>
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCoupon.code);
                    toast.success('Cupom copiado!');
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/50 border-slate-700 text-white"
                >
                  <Copy className="w-3 h-3 mr-2" />
                  Copiar Código
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            {!generatedCoupon ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowCouponDialog(false)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => createCouponMutation.mutate()}
                  disabled={createCouponMutation.isPending || !couponCode}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  {createCouponMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Gerar
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setGeneratedCoupon(null);
                  setShowCouponDialog(false);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white w-full"
              >
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}