import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Download, FileText, DollarSign, Calendar, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EnterpriseTeamManagement({ members, sales }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    salary: 0,
    contract_type: "CLT",
    contract_type_other: "",
    contract_start_date: "",
    contract_end_date: "",
    notification_enabled: false,
    notification_days_before: 30,
  });

  const queryClient = useQueryClient();

  const createMemberMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      salary: 0,
      contract_type: "CLT",
      contract_type_other: "",
      contract_start_date: "",
      contract_end_date: "",
      notification_enabled: false,
      notification_days_before: 30,
    });
  };

  const handleSubmit = () => {
    createMemberMutation.mutate(formData);
  };

  const getMemberSales = (memberId) => {
    return sales.filter(s => s.team_member_id === memberId && s.status === "approved");
  };

  const getMemberRevenue = (memberId) => {
    const memberSales = getMemberSales(memberId);
    return memberSales.reduce((sum, s) => sum + (s.amount || 0), 0);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Gestão de Equipe</h2>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Membro
          </Button>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Nenhum membro cadastrado ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member, index) => {
              const memberSales = getMemberSales(member.id);
              const memberRevenue = getMemberRevenue(member.id);
              
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-slate-800/30 border-slate-700/50 p-4 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-bold">{member.name}</h3>
                        <p className="text-slate-400 text-sm">{member.role}</p>
                      </div>
                      <Badge className={`${
                        member.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                        member.status === "inactive" ? "bg-slate-500/20 text-slate-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      } text-xs`}>
                        {member.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="text-slate-300 text-xs truncate ml-2">{member.email}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Salário:</span>
                        <span className="text-emerald-400 font-bold">R$ {member.salary.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Contrato:</span>
                        <span className="text-slate-300">{member.contract_type}</span>
                      </div>

                      {member.contract_end_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Vencimento:</span>
                          <span className="text-slate-300 text-xs">
                            {format(new Date(member.contract_end_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-slate-700/50 pt-2 mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500">Vendas:</span>
                          <span className="text-white font-semibold">{memberSales.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Receita:</span>
                          <span className="text-purple-400 font-bold">R$ {memberRevenue.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-slate-800 border-slate-700 text-white text-xs"
                        onClick={() => setSelectedMember(member)}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Detalhes
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Membro</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label>Cargo/Função *</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  placeholder="Ex: Vendedor, Gestor, Analista"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Salário (R$)</Label>
                <Input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value) || 0})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label>Regime de Contratação *</Label>
                <Select value={formData.contract_type} onValueChange={(value) => setFormData({...formData, contract_type: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="B2B">B2B</SelectItem>
                    <SelectItem value="PARCERIA">Parceria</SelectItem>
                    <SelectItem value="PRESTACAO_SERVICO">Prestação de Serviço</SelectItem>
                    <SelectItem value="OUTROS">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.contract_type === "OUTROS" && (
              <div>
                <Label>Especifique o Regime</Label>
                <Input
                  value={formData.contract_type_other}
                  onChange={(e) => setFormData({...formData, contract_type_other: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={formData.contract_start_date}
                  onChange={(e) => setFormData({...formData, contract_start_date: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => setFormData({...formData, contract_end_date: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="bg-slate-800 border-slate-700 text-white">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.email || !formData.role || createMemberMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {createMemberMutation.isPending ? "Salvando..." : "Adicionar Membro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}