import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Palette, Save, RefreshCw, Edit, Layers, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import BackgroundEditor from "./BackgroundEditor";

const COMPREHENSIVE_PAGE_ELEMENTS = {
  "Dashboard": {
    sections: [
      {
        name: "Header",
        elements: [
          { id: "header_title", label: "Título Principal", type: "text", default: "Dashboard" },
          { id: "header_subtitle", label: "Subtítulo", type: "text", default: "Visão Geral dos Trades" },
          { id: "header_bg", label: "Background Header", type: "color", default: "#0f172a" },
          { id: "header_text_color", label: "Cor do Texto", type: "color", default: "#ffffff" }
        ]
      },
      {
        name: "Cards de Estatísticas",
        elements: [
          { id: "stats_card_bg", label: "Fundo dos Cards", type: "color", default: "#1e293b" },
          { id: "stats_card_border", label: "Borda dos Cards", type: "color", default: "#334155" },
          { id: "stats_card_text", label: "Cor do Texto", type: "color", default: "#ffffff" },
          { id: "stats_card_icon_color", label: "Cor dos Ícones", type: "color", default: "#10b981" },
          { id: "stats_title_balance", label: "Título - Saldo", type: "text", default: "Saldo Atual" },
          { id: "stats_title_pl", label: "Título - P/L", type: "text", default: "P/L Total" },
          { id: "stats_title_winrate", label: "Título - Win Rate", type: "text", default: "Win Rate" },
          { id: "stats_card_radius", label: "Raio das Bordas", type: "number", default: "16" }
        ]
      },
      {
        name: "Cards de Trades",
        elements: [
          { id: "trade_card_bg", label: "Fundo do Card", type: "color", default: "#0f172a" },
          { id: "trade_card_border", label: "Borda do Card", type: "color", default: "#334155" },
          { id: "trade_card_text", label: "Cor do Texto", type: "color", default: "#ffffff" },
          { id: "trade_card_profit_color", label: "Cor Lucro", type: "color", default: "#10b981" },
          { id: "trade_card_loss_color", label: "Cor Prejuízo", type: "color", default: "#ef4444" },
          { id: "trade_card_button_bg", label: "Botões - Fundo", type: "color", default: "#3b82f6" },
          { id: "trade_card_button_text", label: "Botões - Texto", type: "color", default: "#ffffff" }
        ]
      },
      {
        name: "Gráficos",
        elements: [
          { id: "chart_bg", label: "Fundo do Gráfico", type: "color", default: "#1e293b" },
          { id: "chart_grid_color", label: "Cor da Grade", type: "color", default: "#475569" },
          { id: "chart_line_color", label: "Cor da Linha", type: "color", default: "#10b981" }
        ]
      }
    ]
  },
  "SejaPRO": {
    sections: [
      {
        name: "Hero Section",
        elements: [
          { id: "hero_title", label: "Título Principal", type: "text", default: "Seja PRO" },
          { id: "hero_subtitle", label: "Subtítulo", type: "textarea", default: "Desbloqueie recursos ilimitados e maximize seus resultados" },
          { id: "hero_bg", label: "Background", type: "color", default: "#7c3aed" },
          { id: "hero_text_color", label: "Cor do Texto", type: "color", default: "#ffffff" },
          { id: "hero_button_text", label: "Texto do Botão", type: "text", default: "Ver Planos" },
          { id: "hero_button_bg", label: "Botão - Fundo", type: "color", default: "#10b981" }
        ]
      },
      {
        name: "Card PRO",
        elements: [
          { id: "card_pro_bg", label: "Fundo", type: "color", default: "#3b82f6" },
          { id: "card_pro_border", label: "Borda", type: "color", default: "#2563eb" },
          { id: "card_pro_text", label: "Cor do Texto", type: "color", default: "#ffffff" },
          { id: "card_pro_title", label: "Título", type: "text", default: "PRO" },
          { id: "card_pro_subtitle", label: "Subtítulo", type: "text", default: "Para traders profissionais" },
          { id: "card_pro_price", label: "Preço", type: "text", default: "R$ 97/mês" },
          { id: "card_pro_feature1", label: "Benefício 1", type: "text", default: "100 trades simultâneos" },
          { id: "card_pro_feature2", label: "Benefício 2", type: "text", default: "30 análises IA/mês" },
          { id: "card_pro_feature3", label: "Benefício 3", type: "text", default: "Suporte prioritário" },
          { id: "card_pro_button_text", label: "Texto Botão", type: "text", default: "Assinar PRO" },
          { id: "card_pro_button_bg", label: "Botão - Fundo", type: "color", default: "#2563eb" }
        ]
      },
      {
        name: "Card PRO+",
        elements: [
          { id: "card_proplus_bg", label: "Fundo", type: "color", default: "#a855f7" },
          { id: "card_proplus_border", label: "Borda", type: "color", default: "#9333ea" },
          { id: "card_proplus_text", label: "Cor do Texto", type: "color", default: "#ffffff" },
          { id: "card_proplus_title", label: "Título", type: "text", default: "PRO+" },
          { id: "card_proplus_subtitle", label: "Subtítulo", type: "text", default: "Máximo desempenho" },
          { id: "card_proplus_price", label: "Preço", type: "text", default: "R$ 197/mês" },
          { id: "card_proplus_feature1", label: "Benefício 1", type: "text", default: "300 trades simultâneos" },
          { id: "card_proplus_feature2", label: "Benefício 2", type: "text", default: "100 análises IA/mês" },
          { id: "card_proplus_feature3", label: "Benefício 3", type: "text", default: "Análise avançada" },
          { id: "card_proplus_button_text", label: "Texto Botão", type: "text", default: "Assinar PRO+" },
          { id: "card_proplus_button_bg", label: "Botão - Fundo", type: "color", default: "#9333ea" }
        ]
      },
      {
        name: "Card INFINITY PRO",
        elements: [
          { id: "card_infinity_bg", label: "Fundo", type: "color", default: "#10b981" },
          { id: "card_infinity_border", label: "Borda", type: "color", default: "#059669" },
          { id: "card_infinity_text", label: "Cor do Texto", type: "color", default: "#ffffff" },
          { id: "card_infinity_title", label: "Título", type: "text", default: "INFINITY PRO" },
          { id: "card_infinity_subtitle", label: "Subtítulo", type: "text", default: "Sem limites" },
          { id: "card_infinity_price", label: "Preço", type: "text", default: "R$ 497/mês" },
          { id: "card_infinity_feature1", label: "Benefício 1", type: "text", default: "Trades ilimitados" },
          { id: "card_infinity_feature2", label: "Benefício 2", type: "text", default: "IA ilimitada" },
          { id: "card_infinity_feature3", label: "Benefício 3", type: "text", default: "Suporte VIP 24/7" },
          { id: "card_infinity_button_text", label: "Texto Botão", type: "text", default: "Assinar INFINITY" },
          { id: "card_infinity_button_bg", label: "Botão - Fundo", type: "color", default: "#059669" }
        ]
      },
      {
        name: "Seção de Benefícios",
        elements: [
          { id: "benefits_title", label: "Título Seção", type: "text", default: "Benefícios Exclusivos" },
          { id: "benefits_bg", label: "Background", type: "color", default: "#1e293b" },
          { id: "benefits_card_bg", label: "Fundo dos Cards", type: "color", default: "#0f172a" }
        ]
      }
    ]
  },
  "AITrader": {
    sections: [
      {
        name: "Header",
        elements: [
          { id: "page_title", label: "Título", type: "text", default: "iA Trader" },
          { id: "page_description", label: "Descrição", type: "textarea", default: "Sinais inteligentes gerados por IA avançada" },
          { id: "header_bg", label: "Background", type: "color", default: "#0f172a" }
        ]
      },
      {
        name: "Seletor de Pares",
        elements: [
          { id: "selector_bg", label: "Fundo", type: "color", default: "#1e293b" },
          { id: "selector_border", label: "Borda", type: "color", default: "#334155" },
          { id: "selector_text", label: "Cor do Texto", type: "color", default: "#ffffff" }
        ]
      },
      {
        name: "Botão Gerar",
        elements: [
          { id: "generate_button_bg", label: "Fundo", type: "color", default: "#8b5cf6" },
          { id: "generate_button_text", label: "Texto", type: "text", default: "Gerar Análise IA" },
          { id: "generate_button_text_color", label: "Cor do Texto", type: "color", default: "#ffffff" }
        ]
      },
      {
        name: "Card de Resultado",
        elements: [
          { id: "result_card_bg", label: "Fundo", type: "color", default: "#1e293b" },
          { id: "result_card_border", label: "Borda", type: "color", default: "#8b5cf6" },
          { id: "result_buy_color", label: "Cor BUY", type: "color", default: "#10b981" },
          { id: "result_sell_color", label: "Cor SELL", type: "color", default: "#ef4444" }
        ]
      }
    ]
  },
  "AddCredito": {
    sections: [
      {
        name: "Header",
        elements: [
          { id: "page_title", label: "Título", type: "text", default: "Adicionar Crédito" },
          { id: "page_subtitle", label: "Subtítulo", type: "text", default: "Aumente seu limite e desbloqueie recursos" }
        ]
      },
      {
        name: "Cards de Pacotes",
        elements: [
          { id: "package_card_bg", label: "Fundo", type: "color", default: "#1e293b" },
          { id: "package_card_border", label: "Borda", type: "color", default: "#334155" },
          { id: "package_card_text", label: "Texto", type: "color", default: "#ffffff" },
          { id: "package_highlight_color", label: "Destaque", type: "color", default: "#10b981" }
        ]
      },
      {
        name: "Métodos de Pagamento",
        elements: [
          { id: "payment_pix_bg", label: "Botão Pix - Fundo", type: "color", default: "#10b981" },
          { id: "payment_pix_text", label: "Botão Pix - Texto", type: "text", default: "Pagar com Pix" },
          { id: "payment_card_bg", label: "Botão Cartão - Fundo", type: "color", default: "#8b5cf6" },
          { id: "payment_card_text", label: "Botão Cartão - Texto", type: "text", default: "Pagar com Cartão" }
        ]
      }
    ]
  }
};

export default function SiteEditor() {
  const [selectedPage, setSelectedPage] = useState("Dashboard");
  const [expandedSections, setExpandedSections] = useState({});
  const [customFields, setCustomFields] = useState({});
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [newFieldData, setNewFieldData] = useState({
    section: "",
    label: "",
    type: "text",
    default: ""
  });
  
  const [pageElements, setPageElements] = useState(() => {
    const initial = {};
    Object.keys(COMPREHENSIVE_PAGE_ELEMENTS).forEach(page => {
      initial[page] = {};
      COMPREHENSIVE_PAGE_ELEMENTS[page].sections.forEach(section => {
        section.elements.forEach(el => {
          initial[page][el.id] = el.default;
        });
      });
    });
    return initial;
  });

  const queryClient = useQueryClient();

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const handleElementChange = (elementId, value) => {
    setPageElements({
      ...pageElements,
      [selectedPage]: {
        ...pageElements[selectedPage],
        [elementId]: value
      }
    });
  };

  const addCustomField = () => {
    if (!newFieldData.label || !newFieldData.section) {
      toast.error("Preencha todos os campos");
      return;
    }

    const fieldId = `custom_${newFieldData.section}_${Date.now()}`;
    
    setCustomFields({
      ...customFields,
      [selectedPage]: [
        ...(customFields[selectedPage] || []),
        {
          id: fieldId,
          sectionName: newFieldData.section,
          label: newFieldData.label,
          type: newFieldData.type,
          default: newFieldData.default
        }
      ]
    });

    setPageElements({
      ...pageElements,
      [selectedPage]: {
        ...pageElements[selectedPage],
        [fieldId]: newFieldData.default
      }
    });

    setShowAddFieldDialog(false);
    setNewFieldData({ section: "", label: "", type: "text", default: "" });
    toast.success("Campo personalizado adicionado!");
  };

  const removeCustomField = (fieldId) => {
    setCustomFields({
      ...customFields,
      [selectedPage]: (customFields[selectedPage] || []).filter(f => f.id !== fieldId)
    });

    const newPageElements = { ...pageElements[selectedPage] };
    delete newPageElements[fieldId];
    setPageElements({
      ...pageElements,
      [selectedPage]: newPageElements
    });

    toast.success("Campo removido");
  };

  const saveConfigMutation = useMutation({
    mutationFn: async (config) => {
      const response = await base44.functions.invoke('saveSiteConfig', {
        page: selectedPage,
        config: {
          elements: config,
          customFields: customFields[selectedPage] || []
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteConfig'] });
      toast.success("Configurações salvas!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    }
  });

  const handleSave = () => {
    saveConfigMutation.mutate(pageElements[selectedPage]);
  };

  const currentPageData = COMPREHENSIVE_PAGE_ELEMENTS[selectedPage];
  const currentValues = pageElements[selectedPage] || {};
  const pageCustomFields = customFields[selectedPage] || [];

  return (
    <div className="space-y-6">
      {/* Background Editor */}
      <BackgroundEditor />

      <Card className="bg-slate-900/50 border-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Editor Completo do Site</h2>
              <p className="text-slate-400 text-sm">Edite todos elementos e adicione campos personalizados</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddFieldDialog(true)}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Campo
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveConfigMutation.isPending}
              className="bg-gradient-to-r from-rose-500 to-pink-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveConfigMutation.isPending ? "Salvando..." : "Salvar Tudo"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Page Selector */}
          <div className="space-y-3">
            <Label className="text-slate-300 font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Páginas ({Object.keys(COMPREHENSIVE_PAGE_ELEMENTS).length})
            </Label>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {Object.keys(COMPREHENSIVE_PAGE_ELEMENTS).map(page => {
                const totalElements = COMPREHENSIVE_PAGE_ELEMENTS[page].sections.reduce(
                  (sum, section) => sum + section.elements.length, 0
                ) + (customFields[page]?.length || 0);
                
                return (
                  <button
                    key={page}
                    onClick={() => setSelectedPage(page)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedPage === page
                        ? 'bg-rose-500/20 border-2 border-rose-500/50 text-rose-400'
                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-sm">{page}</div>
                    <div className="text-xs opacity-70">
                      {totalElements} elementos editáveis
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Elements Editor */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Edit className="w-5 h-5 text-rose-400" />
                <h3 className="text-white font-bold text-lg">{selectedPage}</h3>
              </div>
              <p className="text-slate-400 text-sm">
                {currentPageData?.sections.length || 0} seções • {
                  currentPageData?.sections.reduce((sum, s) => sum + s.elements.length, 0) || 0
                } elementos nativos • {pageCustomFields.length} campos personalizados
              </p>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {currentPageData?.sections.map((section) => (
                <Card key={section.name} className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.name)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      {expandedSections[section.name] ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-white font-semibold">{section.name}</span>
                      <span className="text-slate-500 text-xs">({section.elements.length})</span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedSections[section.name] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-3">
                          {section.elements.map((element) => (
                            <div key={element.id} className="bg-slate-900/50 rounded-lg p-3">
                              <Label className="text-slate-300 text-xs mb-2 block">
                                {element.label}
                              </Label>
                              
                              {element.type === "text" && (
                                <Input
                                  type="text"
                                  value={currentValues[element.id] || element.default}
                                  onChange={(e) => handleElementChange(element.id, e.target.value)}
                                  className="bg-slate-800/50 border-slate-700 text-white"
                                />
                              )}

                              {element.type === "textarea" && (
                                <Textarea
                                  value={currentValues[element.id] || element.default}
                                  onChange={(e) => handleElementChange(element.id, e.target.value)}
                                  className="bg-slate-800/50 border-slate-700 text-white min-h-20"
                                />
                              )}

                              {element.type === "number" && (
                                <Input
                                  type="number"
                                  value={currentValues[element.id] || element.default}
                                  onChange={(e) => handleElementChange(element.id, e.target.value)}
                                  className="bg-slate-800/50 border-slate-700 text-white"
                                />
                              )}

                              {element.type === "color" && (
                                <div className="flex gap-2">
                                  <Input
                                    type="color"
                                    value={currentValues[element.id] || element.default}
                                    onChange={(e) => handleElementChange(element.id, e.target.value)}
                                    className="w-16 h-9"
                                  />
                                  <Input
                                    type="text"
                                    value={currentValues[element.id] || element.default}
                                    onChange={(e) => handleElementChange(element.id, e.target.value)}
                                    className="flex-1 bg-slate-800/50 border-slate-700 text-white font-mono text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Custom fields for this section */}
                          {pageCustomFields.filter(f => f.sectionName === section.name).map(field => (
                            <div key={field.id} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-purple-300 text-xs font-semibold">
                                  {field.label} (Personalizado)
                                </Label>
                                <button
                                  onClick={() => removeCustomField(field.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              {field.type === "text" && (
                                <Input
                                  type="text"
                                  value={currentValues[field.id] || field.default}
                                  onChange={(e) => handleElementChange(field.id, e.target.value)}
                                  className="bg-slate-800/50 border-slate-700 text-white"
                                />
                              )}

                              {field.type === "textarea" && (
                                <Textarea
                                  value={currentValues[field.id] || field.default}
                                  onChange={(e) => handleElementChange(field.id, e.target.value)}
                                  className="bg-slate-800/50 border-slate-700 text-white"
                                />
                              )}

                              {field.type === "color" && (
                                <div className="flex gap-2">
                                  <Input
                                    type="color"
                                    value={currentValues[field.id] || field.default}
                                    onChange={(e) => handleElementChange(field.id, e.target.value)}
                                    className="w-16 h-9"
                                  />
                                  <Input
                                    type="text"
                                    value={currentValues[field.id] || field.default}
                                    onChange={(e) => handleElementChange(field.id, e.target.value)}
                                    className="flex-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Add Custom Field Dialog */}
      <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Adicionar Campo Personalizado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Seção</Label>
              <Select value={newFieldData.section} onValueChange={(v) => setNewFieldData({...newFieldData, section: v})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Escolha a seção" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {currentPageData?.sections.map(section => (
                    <SelectItem key={section.name} value={section.name} className="text-white">
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Nome do Campo</Label>
              <Input
                value={newFieldData.label}
                onChange={(e) => setNewFieldData({...newFieldData, label: e.target.value})}
                placeholder="Ex: Novo Título"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Tipo</Label>
              <Select value={newFieldData.type} onValueChange={(v) => setNewFieldData({...newFieldData, type: v})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="text" className="text-white">Texto</SelectItem>
                  <SelectItem value="textarea" className="text-white">Texto Longo</SelectItem>
                  <SelectItem value="color" className="text-white">Cor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Valor Padrão</Label>
              <Input
                value={newFieldData.default}
                onChange={(e) => setNewFieldData({...newFieldData, default: e.target.value})}
                placeholder="Valor inicial"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddFieldDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button onClick={addCustomField} className="bg-gradient-to-r from-emerald-500 to-teal-600">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}