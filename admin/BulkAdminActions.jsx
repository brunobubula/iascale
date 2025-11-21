import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserCog, UserPlus, Ban, Check, Edit, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function BulkAdminActions({ allUsers, auxiliaryAdmins }) {
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionType, setActionType] = useState("");
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [newAdminsEmails, setNewAdminsEmails] = useState("");

  const queryClient = useQueryClient();

  const adminUsers = allUsers.filter(u => auxiliaryAdmins.some(a => a.user_id === u.id));
  
  const filteredAdmins = adminUsers.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedAdmins(filteredAdmins.map(u => u.id));
    } else {
      setSelectedAdmins([]);
    }
  };

  const handleSelectAdmin = (userId, checked) => {
    if (checked) {
      setSelectedAdmins([...selectedAdmins, userId]);
    } else {
      setSelectedAdmins(selectedAdmins.filter(id => id !== userId));
      setSelectAll(false);
    }
  };

  const bulkAdminActionMutation = useMutation({
    mutationFn: async ({ action, data }) => {
      const response = await base44.functions.invoke('bulkAdminActions', {
        adminIds: selectedAdmins,
        action,
        data
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['auxiliaryAdmins'] });
      setShowActionDialog(false);
      setSelectedAdmins([]);
      setSelectAll(false);
      setNewAdminsEmails("");
      toast.success("Ação executada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    }
  });

  const createAdminsMutation = useMutation({
    mutationFn: async () => {
      const emails = newAdminsEmails.split('\n').map(e => e.trim()).filter(e => e);
      const response = await base44.functions.invoke('createBulkAdmins', {
        emails
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['auxiliaryAdmins'] });
      setShowActionDialog(false);
      setNewAdminsEmails("");
      toast.success("Admins criados com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    }
  });

  const handleExecuteAction = () => {
    if (actionType === "create") {
      if (!newAdminsEmails.trim()) {
        toast.error("Informe pelo menos um email");
        return;
      }
      createAdminsMutation.mutate();
    } else {
      if (selectedAdmins.length === 0) {
        toast.error("Selecione pelo menos um admin");
        return;
      }
      bulkAdminActionMutation.mutate({ action: actionType, data: {} });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <UserCog className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Ações em Massa - Admins</h3>
          </div>
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            {selectedAdmins.length} selecionado{selectedAdmins.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Buscar admins..."
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
              Selecionar todos ({filteredAdmins.length})
            </label>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 bg-slate-800/20 rounded-lg p-3">
            {filteredAdmins.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-slate-800/30 rounded-lg transition-all">
                <Checkbox
                  checked={selectedAdmins.includes(user.id)}
                  onCheckedChange={(checked) => handleSelectAdmin(user.id, checked)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{user.full_name || user.email}</p>
                  <p className="text-slate-400 text-xs truncate">{user.email}</p>
                </div>
                <UserCog className="w-4 h-4 text-yellow-400" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          onClick={() => {
            setActionType("create");
            setShowActionDialog(true);
          }}
          className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Criar em Massa
        </Button>

        <Button
          onClick={() => openActionDialog("suspend")}
          disabled={selectedAdmins.length === 0}
          className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-400 disabled:opacity-30"
        >
          <Ban className="w-4 h-4 mr-2" />
          Suspender
        </Button>

        <Button
          onClick={() => openActionDialog("activate")}
          disabled={selectedAdmins.length === 0}
          className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 disabled:opacity-30"
        >
          <Check className="w-4 h-4 mr-2" />
          Ativar
        </Button>

        <Button
          onClick={() => openActionDialog("remove")}
          disabled={selectedAdmins.length === 0}
          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 disabled:opacity-30"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remover
        </Button>
      </div>

      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "create" && "Criar Admins em Massa"}
              {actionType === "suspend" && "Suspender Admins"}
              {actionType === "activate" && "Ativar Admins"}
              {actionType === "remove" && "Remover Admins"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === "create" ? (
              <>
                <p className="text-slate-400 text-sm">
                  Insira os emails dos novos admins (um por linha):
                </p>
                <textarea
                  placeholder="admin1@example.com&#10;admin2@example.com&#10;admin3@example.com"
                  value={newAdminsEmails}
                  onChange={(e) => setNewAdminsEmails(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white min-h-32"
                />
              </>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-400 text-sm">
                  Confirma a ação para <span className="font-bold">{selectedAdmins.length} admin(s)</span>?
                </p>
              </div>
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
              disabled={bulkAdminActionMutation.isPending || createAdminsMutation.isPending}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white"
            >
              {(bulkAdminActionMutation.isPending || createAdminsMutation.isPending) ? "Executando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}