import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Plus, Edit, Trash2, CheckCircle, XCircle, Package, DollarSign, Link2, Settings, Key, History, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ALL_PACKAGES = [
  { id: "1", name: "PackCrédito Start", value: 150 },
  { id: "2", name: "PackCrédito Trader", value: 500 },
  { id: "3", name: "PackCrédito Gestor", value: 1000 },
  { id: "4", name: "PackCrédito Business", value: 5000 },
  { id: "5", name: "PackCrédito LíderVIP1", value: 10000 },
  { id: "6", name: "PackCrédito LíderCripto", value: 25000 },
  { id: "7", name: "PackCrédito Builder", value: 50000 }
];

export default function EduzzProductsManager() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [formData, setFormData] = useState({
    package_id: "",
    eduzz_content_id: ""
  });
  const [configData, setConfigData] = useState({
    client_id: "",
    client_secret: ""
  });
  const [validationError, setValidationError] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['eduzzMappings'],
    queryFn: () => base44.asServiceRole.entities.EduzzProductMapping.list('-created_date'),
  });

  const { data: eduzzProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['eduzzProducts'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('syncEduzzProducts');
        console.log('📦 Produtos carregados:', response.data);
        return response.data?.products || [];
      } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
        return [];
      }
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncEduzzProducts');
      console.log('🔍 Resposta completa:', response);
      setDebugInfo(response.data);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['eduzzProducts'] });
      const total = response.data?.total || 0;
      if (total > 0) {
        toast.success(`${total} produtos sincronizados com sucesso!`);
        setDebugInfo(null);
      } else {
        toast.warning("Nenhum produto encontrado. Veja detalhes abaixo.");
      }
    },
    onError: (error) => {
      console.error('❌ Erro completo:', error);
      const errorData = error.response?.data || { error: error.message };
      setDebugInfo(errorData);
      toast.error("Erro ao sincronizar. Veja detalhes abaixo.");
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const selectedPackage = ALL_PACKAGES.find(p => p.id === data.package_id);
      const eduzzProduct = eduzzProducts.find(p => p.contentId === data.eduzz_content_id);
      
      const mappingData = {
        package_id: data.package_id,
        package_name: selectedPackage.name,
        package_value: selectedPackage.value,
        eduzz_content_id: data.eduzz_content_id,
        eduzz_product_name: eduzzProduct?.name || '',
        is_active: true,
        last_synced: new Date().toISOString()
      };

      if (editingMapping) {
        return base44.asServiceRole.entities.EduzzProductMapping.update(editingMapping.id, mappingData);
      } else {
        return base44.asServiceRole.entities.EduzzProductMapping.create(mappingData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eduzzMappings'] });
      setShowDialog(false);
      setEditingMapping(null);
      setFormData({ package_id: "", eduzz_content_id: "" });
      toast.success(editingMapping ? "Mapeamento atualizado!" : "Mapeamento criado!");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.EduzzProductMapping.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eduzzMappings'] });
      toast.success("Mapeamento removido!");
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => 
      base44.asServiceRole.entities.EduzzProductMapping.update(id, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eduzzMappings'] });
    }
  });

  const handleEdit = (mapping) => {
    setEditingMapping(mapping);
    setFormData({
      package_id: mapping.package_id,
      eduzz_content_id: mapping.eduzz_content_id
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.package_id || !formData.eduzz_content_id) {
      setValidationError("⚠️ Ambos os campos devem ser preenchidos");
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setValidationError("");
    saveMutation.mutate(formData);
  };

  const availablePackages = ALL_PACKAGES.filter(pkg => 
    !mappings.some(m => m.package_id === pkg.id && m.id !== editingMapping?.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Pacotes de Crédito Eduzz</h2>
          <p className="text-slate-400 text-sm">Gerencie os produtos vinculados à Eduzz</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowConfigDialog(true)}
            variant="outline"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            variant="outline"
            className="bg-blue-600 border-blue-500 hover:bg-blue-700 text-white"
          >
            {syncMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sincronizar
          </Button>
          <Button
            onClick={() => {
              setEditingMapping(null);
              setFormData({ package_id: "", eduzz_content_id: "" });
              setValidationError("");
              setShowDialog(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Mapeamento
          </Button>
        </div>
        </div>

        {debugInfo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <Card className="bg-red-900/20 border-red-500/50 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <h3 className="text-red-400 font-bold">Debug - Resposta da API</h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDebugInfo(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <pre className="bg-slate-900/50 rounded-lg p-4 text-xs text-slate-300 overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </Card>
        </motion.div>
        )}

        <Tabs defaultValue="mapeamentos" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="mapeamentos" className="data-[state=active]:bg-slate-700">
            <Package className="w-4 h-4 mr-2" />
            Mapeamentos Ativos
          </TabsTrigger>
          <TabsTrigger value="historico" className="data-[state=active]:bg-slate-700">
            <History className="w-4 h-4 mr-2" />
            Histórico Completo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mapeamentos" className="mt-6">

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : mappings.filter(m => m.is_active).length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
              <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum mapeamento ativo</p>
              <p className="text-slate-500 text-sm mt-2">Clique em "Novo Mapeamento" para começar</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mappings.filter(m => m.is_active).map((mapping) => (
                <motion.div
                  key={mapping.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 p-4 hover:border-emerald-500/50 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-white font-bold text-sm">
                            {mapping.package_name}
                          </h3>
                        </div>
                        <p className="text-emerald-400 font-semibold text-lg">
                          R$ {mapping.package_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
                          Ativo
                        </span>
                        <button
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: mapping.id, 
                            isActive: mapping.is_active 
                          })}
                          className="flex-shrink-0"
                        >
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 mb-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Link2 className="w-3 h-3 text-blue-400" />
                        <span className="text-slate-400">Content ID:</span>
                        <span className="text-white font-mono font-bold">{mapping.eduzz_content_id}</span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-start gap-2">
                        <DollarSign className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{mapping.eduzz_product_name}</span>
                      </div>
                      {mapping.last_synced && (
                        <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                          Sincronizado: {new Date(mapping.last_synced).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(mapping)}
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm('Desativar este mapeamento?')) {
                            toggleActiveMutation.mutate({ 
                              id: mapping.id, 
                              isActive: mapping.is_active 
                            });
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="bg-yellow-900/20 border-yellow-500/30 hover:bg-yellow-900/40 text-yellow-400"
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : mappings.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
              <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum histórico disponível</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {mappings.map((mapping) => (
                <motion.div
                  key={mapping.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className={`bg-slate-800/50 border-slate-700 p-4 ${
                    !mapping.is_active && 'opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Pacote do App</p>
                          <p className="text-white font-bold">{mapping.package_name}</p>
                          <p className="text-emerald-400 text-sm">R$ {mapping.package_value.toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Content ID</p>
                          <p className="text-white font-mono font-bold">{mapping.eduzz_content_id}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Produto Eduzz</p>
                          <p className="text-slate-300 text-sm">{mapping.eduzz_product_name}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Status</p>
                          <div className="flex items-center gap-2">
                            {mapping.is_active ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400 text-sm font-semibold">Ativo</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-500 text-sm">Inativo</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEdit(mapping)}
                          size="sm"
                          variant="outline"
                          className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: mapping.id, 
                            isActive: mapping.is_active 
                          })}
                          size="sm"
                          variant="outline"
                          className={mapping.is_active 
                            ? "bg-yellow-900/20 border-yellow-500/30 hover:bg-yellow-900/40 text-yellow-400"
                            : "bg-emerald-900/20 border-emerald-500/30 hover:bg-emerald-900/40 text-emerald-400"
                          }
                        >
                          {mapping.is_active ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm('Remover permanentemente este mapeamento?')) {
                              deleteMutation.mutate(mapping.id);
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="bg-red-900/20 border-red-500/30 hover:bg-red-900/40 text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingMapping ? 'Editar Mapeamento' : 'Novo Mapeamento'}
            </DialogTitle>
            <p className="text-slate-400 text-sm">
              Conecte um pacote do app com um produto da Eduzz
            </p>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <AnimatePresence>
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{validationError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label className="text-slate-300 font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Pacote do App *
              </Label>
              <Select 
                value={formData.package_id} 
                onValueChange={(value) => {
                  setFormData({ ...formData, package_id: value });
                  setValidationError("");
                }}
              >
                <SelectTrigger className={`bg-slate-800 border-slate-700 text-white h-12 ${
                  validationError && !formData.package_id ? 'border-red-500/50' : ''
                }`}>
                  <SelectValue placeholder="Selecione o pacote interno" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {availablePackages.length === 0 ? (
                    <div className="p-3 text-slate-400 text-sm">
                      Todos os pacotes já estão mapeados
                    </div>
                  ) : (
                    availablePackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id} className="text-white">
                        <div className="flex items-center justify-between w-full">
                          <span>{pkg.name}</span>
                          <span className="text-emerald-400 font-semibold ml-4">
                            R$ {pkg.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Escolha qual pacote de crédito do app será vinculado
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 font-semibold flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-400" />
                Produto Eduzz (Content ID) *
              </Label>
              <Select 
                value={formData.eduzz_content_id} 
                onValueChange={(value) => {
                  setFormData({ ...formData, eduzz_content_id: value });
                  setValidationError("");
                }}
              >
                <SelectTrigger className={`bg-slate-800 border-slate-700 text-white h-12 ${
                  validationError && !formData.eduzz_content_id ? 'border-red-500/50' : ''
                }`}>
                  <SelectValue placeholder="Selecione o produto da Eduzz" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-80">
                  {isLoadingProducts ? (
                    <div className="p-3 text-slate-400 text-sm flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Carregando produtos...
                    </div>
                  ) : eduzzProducts.length === 0 ? (
                    <div className="p-3 text-slate-400 text-sm">
                      Nenhum produto encontrado. Clique em "Sincronizar".
                    </div>
                  ) : (
                    eduzzProducts.map((product) => (
                      <SelectItem key={product.contentId} value={product.contentId} className="text-white">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold">{product.name}</span>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span className="font-mono">{product.contentId}</span>
                            <span>•</span>
                            <span className="text-emerald-400">R$ {product.price}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Escolha qual produto/variação da Eduzz será usado para pagamento
              </p>
            </div>

            {formData.package_id && formData.eduzz_content_id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <p className="text-emerald-400 font-semibold">Pré-visualização do Mapeamento</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-300">
                    <span className="text-slate-500">Pacote:</span>{" "}
                    {ALL_PACKAGES.find(p => p.id === formData.package_id)?.name}
                  </p>
                  <p className="text-slate-300">
                    <span className="text-slate-500">Content ID:</span>{" "}
                    <span className="font-mono">{formData.eduzz_content_id}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setValidationError("");
              }}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !formData.package_id || !formData.eduzz_content_id}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Salvar Mapeamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              Configurações da Eduzz Developer Hub
            </DialogTitle>
            <p className="text-slate-400 text-sm">
              Configure as credenciais OAuth para sincronizar produtos
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Key className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-semibold text-sm">Como obter as credenciais?</p>
                  <ol className="text-xs text-slate-400 mt-2 space-y-1 list-decimal list-inside">
                    <li>Acesse <a href="https://developers.eduzz.com" target="_blank" className="text-blue-400 underline">developers.eduzz.com</a></li>
                    <li>Crie um novo aplicativo na Developer Hub</li>
                    <li>Copie o Client ID e Client Secret</li>
                    <li>Configure-os como secrets no Base44</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-800/50 rounded-lg p-4">
              <div>
                <Label className="text-slate-300 text-sm mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Secret Name: EDUZZ_CLIENT_ID
                </Label>
                <Input
                  value={configData.client_id}
                  onChange={(e) => setConfigData({ ...configData, client_id: e.target.value })}
                  placeholder="Digite o Client ID"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300 text-sm mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Secret Name: EDUZZ_CLIENT_SECRET
                </Label>
                <Input
                  type="password"
                  value={configData.client_secret}
                  onChange={(e) => setConfigData({ ...configData, client_secret: e.target.value })}
                  placeholder="Digite o Client Secret"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-400 text-xs">
                    Estes valores devem ser configurados como <strong>secrets do ambiente</strong> no painel Base44 
                    (Dashboard → Code → Secrets). Esta tela é apenas informativa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfigDialog(false)}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                syncMutation.mutate();
                setShowConfigDialog(false);
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Testar Conexão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}