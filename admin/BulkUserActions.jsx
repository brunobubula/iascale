import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Send, Ban, Check, CreditCard, Crown, MessageSquare, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function BulkUserActions({ allUsers }) {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionType, setActionType] = useState("");
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("alert");
  const [blockReason, setBlockReason] = useState("");
  const [blockType, setBlockType] = useState("temporary");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditOperation, setCreditOperation] = useState("add");
  const [planType, setPlanType] = useState("");
  const [planDuration, setPlanDuration] = useState("30");

  const queryClient = useQueryClient();

  const filteredUsers = allUsers.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
      setSelectAll(false);
    }
  };

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, data }) => {
      const response = await base44.functions.invoke('bulkUserActions', {
        userIds: selectedUsers,
        action,
        data
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setShowActionDialog(false);
      setSelectedUsers([]);
      setSelectAll(false);
      resetForm();
      toast.success("Ação executada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao executar ação: " + error.message);
    }
  });

  const resetForm = () => {
    setNotificationTitle("");
    setNotificationMessage("");
    setNotificationType("alert");
    setBlockReason("");
    setBlockType("temporary");
    setCreditAmount("");
    setCreditOperation("add");
    setPlanType("");
    setPlanDuration("30");
  };

  const prepareActionData = () => {
    let data = {};
    if (actionType === "notify") {
      if (!notificationTitle || !notificationMessage) {
        toast.error("Preencha título e mensagem");
        return null;
      }
      data = { 
        title: notificationTitle, 
        message: notificationMessage,
        type: notificationType 
      };
    } else if (actionType === "block") {
      if (!blockReason) {
        toast.error("Informe o motivo do bloqueio");
        return null;
      }
      data = { 
        reason: blockReason,
        blockType: blockType
      };
    } else if (actionType === "unblock") {
      data = {};
    } else if (actionType === "credits") {
      if (!creditAmount) {
        toast.error("Informe o valor dos créditos");
        return null;
      }
      data = { 
        amount: parseFloat(creditAmount),
        operation: creditOperation
      };
    } else if (actionType === "activate_plan") {
      if (!planType) {
        toast.error("Selecione um plano");
        return null;
      }
      data = { planType, durationDays: parseInt(planDuration) };
    }
    return data;
  };

  const handleExecuteAction = () => {
    if (selectedUsers.length === 0) {
      toast.error("Selecione pelo menos um usuário");
      return;
    }

    const data = prepareActionData();
    if (!data) return;

    setShowActionDialog(false);
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = () => {
    const data = prepareActionData();
    if (!data) return;

    bulkActionMutation.mutate({ action: actionType, data });
    setShowConfirmDialog(false);
  };

  const openActionDialog = (action) => {
    if (selectedUsers.length === 0) {
      toast.error("Selecione pelo menos um usuário primeiro");
      return;
    }
    setActionType(action);
    setShowActionDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Ações em Massa</h3>
          </div>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            {selectedUsers.length} selecionado{selectedUsers.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Buscar usuários por email ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800/50 border-slate-700 text-white"
          />

          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <label className="text-slate-300 text-sm cursor-pointer" onClick={() => handleSelectAll(!selectAll)}>
              Selecionar todos ({filteredUsers.length})
            </label>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 bg-slate-800/20 rounded-lg p-3">
            {filteredUsers.slice(0, 50).map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-slate-800/30 rounded-lg transition-all">
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={(checked) => handleSelectUser(user.id, checked)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{user.full_name || user.email}</p>
                  <p className="text-slate-400 text-xs truncate">{user.email}</p>
                </div>
                {user.is_pro && <Crown className="w-4 h-4 text-yellow-400" />}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {selectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          <Button
            onClick={() => openActionDialog("notify")}
            className="bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 text-pink-400"
          >
            <Send className="w-4 h-4 mr-2" />
            Notificar
          </Button>

          <Button
            onClick={() => openActionDialog("block")}
            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400"
          >
            <Ban className="w-4 h-4 mr-2" />
            Bloquear
          </Button>

          <Button
            onClick={() => openActionDialog("unblock")}
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400"
          >
            <Check className="w-4 h-4 mr-2" />
            Desbloquear
          </Button>

          <Button
            onClick={() => openActionDialog("credits")}
            className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Ajustar C$
          </Button>

          <Button
            onClick={() => openActionDialog("activate_plan")}
            className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400"
          >
            <Crown className="w-4 h-4 mr-2" />
            Ativar Plano
          </Button>
        </motion.div>
      )}

      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "notify" && "Enviar Notificação"}
              {actionType === "block" && "Bloquear Usuários"}
              {actionType === "unblock" && "Desbloquear Usuários"}
              {actionType === "credits" && "Ajustar Créditos"}
              {actionType === "activate_plan" && "Ativar Plano"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-blue-400 text-sm">
                Ação será aplicada a <span className="font-bold">{selectedUsers.length} usuário(s)</span>
              </p>
            </div>

            {actionType === "notify" && (
              <>
                <Input
                  placeholder="Título da notificação"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                <Textarea
                  placeholder="Mensagem..."
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white min-h-24"
                />
                <Select value={notificationType} onValueChange={setNotificationType}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Tipo de notificação" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="alert" className="text-white">Alerta</SelectItem>
                    <SelectItem value="payment_info" className="text-white">Info de Pagamento</SelectItem>
                    <SelectItem value="usage_status" className="text-white">Status de Uso</SelectItem>
                    <SelectItem value="account_update" className="text-white">Atualização de Conta</SelectItem>
                    <SelectItem value="critical" className="text-white">Crítico</SelectItem>
                    <SelectItem value="action_required" className="text-white">Ação Necessária</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            {actionType === "block" && (
              <>
                <Textarea
                  placeholder="Motivo do bloqueio (obrigatório)..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white min-h-24"
                />
                <Select value={blockType} onValueChange={setBlockType}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Tipo de bloqueio" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="temporary" className="text-white">Temporário (7 dias)</SelectItem>
                    <SelectItem value="permanent" className="text-white">Permanente</SelectItem>
                    <SelectItem value="suspicious_activity" className="text-white">Atividade Suspeita</SelectItem>
                    <SelectItem value="payment_fraud" className="text-white">Fraude de Pagamento</SelectItem>
                    <SelectItem value="terms_violation" className="text-white">Violação de Termos</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            {actionType === "credits" && (
              <>
                <Select value={creditOperation} onValueChange={setCreditOperation}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Operação" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="add" className="text-white">Adicionar Créditos</SelectItem>
                    <SelectItem value="remove" className="text-white">Remover Créditos</SelectItem>
                    <SelectItem value="set" className="text-white">Definir Saldo Exato</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Valor dos créditos (C$)"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                <p className="text-slate-400 text-xs">
                  {creditOperation === "add" && "Os créditos serão adicionados ao saldo atual"}
                  {creditOperation === "remove" && "Os créditos serão subtraídos do saldo atual"}
                  {creditOperation === "set" && "O saldo será definido para este valor exato"}
                </p>
              </>
            )}

            {actionType === "activate_plan" && (
              <>
                <Select value={planType} onValueChange={setPlanType}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="pro" className="text-white">PRO (100 trades)</SelectItem>
                    <SelectItem value="pro_plus" className="text-white">PRO+ (300 trades)</SelectItem>
                    <SelectItem value="infinity_pro" className="text-white">INFINITY PRO (Ilimitado)</SelectItem>
                    <SelectItem value="enterprise" className="text-white">ENTERPRISE (Customizado)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Duração em dias"
                  value={planDuration}
                  onChange={(e) => setPlanDuration(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                <p className="text-slate-400 text-xs">
                  O plano será ativado por {planDuration} dias a partir de agora
                </p>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActionDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteAction}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-400" />
              Confirmar Ação em Massa
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm font-semibold mb-2">
                ⚠️ Atenção! Esta ação será aplicada a:
              </p>
              <p className="text-white text-lg font-black">
                {selectedUsers.length} usuário{selectedUsers.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Ação:</span>
                <span className="text-white font-semibold">
                  {actionType === "notify" && "Enviar Notificação"}
                  {actionType === "block" && "Bloquear Usuários"}
                  {actionType === "unblock" && "Desbloquear Usuários"}
                  {actionType === "credits" && `${creditOperation === 'add' ? 'Adicionar' : creditOperation === 'remove' ? 'Remover' : 'Definir'} Créditos`}
                  {actionType === "activate_plan" && "Ativar Plano"}
                </span>
              </div>
              {actionType === "notify" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Título:</span>
                    <span className="text-white font-semibold truncate max-w-[180px]">{notificationTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipo:</span>
                    <span className="text-white font-semibold">{notificationType}</span>
                  </div>
                </>
              )}
              {actionType === "block" && blockReason && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipo:</span>
                    <span className="text-white font-semibold">{blockType}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50">
                    <span className="text-slate-400 text-xs">Motivo:</span>
                    <p className="text-white text-xs mt-1">{blockReason}</p>
                  </div>
                </>
              )}
              {actionType === "credits" && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor:</span>
                  <span className="text-white font-semibold">C$ {parseFloat(creditAmount).toFixed(2)}</span>
                </div>
              )}
              {actionType === "activate_plan" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plano:</span>
                    <span className="text-white font-semibold">{planType?.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duração:</span>
                    <span className="text-white font-semibold">{planDuration} dias</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-300 text-xs">
                ⚠️ Esta ação não pode ser desfeita. Confirme que todos os dados estão corretos.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={bulkActionMutation.isPending}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={bulkActionMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold"
            >
              {bulkActionMutation.isPending ? (
                <>Executando...</>
              ) : (
                <>Confirmar e Executar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}