import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle, XCircle, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const AVAILABLE_GATEWAYS = [
  "Eduzz", "Hotmart", "Stripe", "PagSeguro", "Mercado Pago", 
  "PayPal", "Kiwify", "Monetizze", "Braip", "Perfect Pay"
];

export default function EnterprisePaymentGateways() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    gateway_name: "",
    api_key: "",
    api_secret: "",
    webhook_token: "",
    is_sandbox: false,
  });

  const queryClient = useQueryClient();

  const { data: integrations = [] } = useQuery({
    queryKey: ['paymentGateways'],
    queryFn: () => base44.entities.PaymentGatewayIntegration.list("-created_date"),
    initialData: [],
  });

  const createIntegrationMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentGatewayIntegration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentGateways'] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PaymentGatewayIntegration.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentGateways'] });
    },
  });

  const resetForm = () => {
    setFormData({
      gateway_name: "",
      api_key: "",
      api_secret: "",
      webhook_token: "",
      is_sandbox: false,
    });
  };

  const handleSubmit = () => {
    createIntegrationMutation.mutate(formData);
  };

  const activeIntegrations = integrations.filter(i => i.is_active);

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Integrações de Pagamento</h2>
            <p className="text-slate-400 text-sm mt-1">
              {activeIntegrations.length} de 10 gateways conectados
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Gateway
          </Button>
        </div>

        {integrations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Nenhuma integração configurada ainda</p>
            <p className="text-slate-500 text-sm mt-2">Conecte seus gateways de pagamento para sincronizar vendas automaticamente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`${
                  integration.is_active 
                    ? "bg-slate-800/30 border-emerald-500/30" 
                    : "bg-slate-800/20 border-slate-700/30"
                } p-4`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-bold">{integration.gateway_name}</h3>
                      {integration.is_sandbox && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs mt-1">
                          Sandbox/Teste
                        </Badge>
                      )}
                    </div>
                    {integration.is_active ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status:</span>
                      <Badge className={`${
                        integration.is_active 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-slate-500/20 text-slate-400"
                      } text-xs`}>
                        {integration.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>

                    {integration.total_sales_synced > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Vendas Sync:</span>
                        <span className="text-white font-semibold">{integration.total_sales_synced}</span>
                      </div>
                    )}

                    {integration.last_sync_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Última Sync:</span>
                        <span className="text-slate-300 text-xs">
                          {new Date(integration.last_sync_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActiveMutation.mutate({ id: integration.id, is_active: !integration.is_active })}
                    className="w-full bg-slate-800 border-slate-700 text-white text-xs"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    {integration.is_active ? "Desativar" : "Ativar"}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Adicionar Gateway de Pagamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Gateway *</Label>
              <Select value={formData.gateway_name} onValueChange={(value) => setFormData({...formData, gateway_name: value})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione o gateway" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {AVAILABLE_GATEWAYS.map(gateway => (
                    <SelectItem key={gateway} value={gateway}>{gateway}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label>API Secret</Label>
              <Input
                type="password"
                value={formData.api_secret}
                onChange={(e) => setFormData({...formData, api_secret: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label>Webhook Token</Label>
              <Input
                value={formData.webhook_token}
                onChange={(e) => setFormData({...formData, webhook_token: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_sandbox}
                onChange={(e) => setFormData({...formData, is_sandbox: e.target.checked})}
                className="w-4 h-4"
              />
              <Label>Modo Sandbox/Teste</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="bg-slate-800 border-slate-700 text-white">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.gateway_name || createIntegrationMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {createIntegrationMutation.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}