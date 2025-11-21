import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Image as ImageIcon, 
  Video, 
  Palette, 
  Save, 
  Upload, 
  Layers,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Loader2,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const PAGES = [
  { id: "Dashboard", name: "Dashboard Principal" },
  { id: "AITrader", name: "iA Trader" },
  { id: "AddSignal", name: "Novo Trade" },
  { id: "AnalisePL", name: "Análise P/L" },
  { id: "Portfolio", name: "Portfólio" },
  { id: "SejaPRO", name: "Seja PRO" },
  { id: "Renda20k", name: "Renda 20k" }
];

export default function BackgroundEditor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedPage, setSelectedPage] = useState("Dashboard");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    background_type: "image",
    background_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/c1919ca9a_5072609.jpg",
    background_opacity: 0.09,
    logo_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/57f18d4cb_Art-ScaleCriptoiA-LOGO6mini.png",
    logo_opacity: 0.93,
    logo_size: 500,
    solid_color: "#0f172a",
    gradient_from: "#0f172a",
    gradient_via: "#1e293b",
    gradient_to: "#0f172a",
    overlay_opacity: 0.7,
    enable_animation: true,
    animation_duration: 60
  });

  const { data: configs = [], refetch } = useQuery({
    queryKey: ['backgroundConfigs'],
    queryFn: () => base44.entities.SiteBackgroundConfig.list('-updated_date'),
    initialData: [],
    staleTime: 0
  });

  const activeConfig = configs.find(c => c.page_name === selectedPage && c.is_active);

  React.useEffect(() => {
    if (activeConfig) {
      setFormData({
        background_type: activeConfig.background_type || "image",
        background_url: activeConfig.background_url || "",
        background_opacity: activeConfig.background_opacity ?? 0.09,
        logo_url: activeConfig.logo_url || "",
        logo_opacity: activeConfig.logo_opacity ?? 0.93,
        logo_size: activeConfig.logo_size || 500,
        solid_color: activeConfig.solid_color || "#0f172a",
        gradient_from: activeConfig.gradient_from || "#0f172a",
        gradient_via: activeConfig.gradient_via || "#1e293b",
        gradient_to: activeConfig.gradient_to || "#0f172a",
        overlay_opacity: activeConfig.overlay_opacity ?? 0.7,
        enable_animation: activeConfig.enable_animation ?? true,
        animation_duration: activeConfig.animation_duration || 60
      });
    }
  }, [activeConfig, selectedPage]);

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [fieldName]: file_url });
      toast({ title: '✅ Arquivo enviado!', duration: 3000 });
    } catch (error) {
      toast({ title: '❌ Erro ao enviar arquivo', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingFile(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🚀 SALVANDO BACKGROUND - MÉTODO RADICAL');
      console.log('📦 Dados:', data);
      console.log('📄 Página:', selectedPage);
      
      // 1. Buscar TODAS as configs da página
      const allPageConfigs = await base44.entities.SiteBackgroundConfig.filter({ 
        page_name: selectedPage 
      });
      
      console.log('🔍 Configs encontradas:', allPageConfigs.length);
      
      // 2. DELETAR TODAS as configs antigas da página
      for (const oldConfig of allPageConfigs) {
        console.log('🗑️ Deletando config antiga:', oldConfig.id);
        await base44.entities.SiteBackgroundConfig.delete(oldConfig.id);
      }
      
      // 3. CRIAR UMA NOVA config do zero
      console.log('✨ Criando nova config...');
      const newConfig = await base44.entities.SiteBackgroundConfig.create({
        ...data,
        page_name: selectedPage,
        is_active: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      });
      
      console.log('✅ Nova config criada:', newConfig.id);
      return newConfig;
    },
    onSuccess: async (newConfig) => {
      console.log('🎯 SUCESSO! Config salva:', newConfig.id);
      
      // 1. Invalidar TODOS os caches relacionados
      await queryClient.invalidateQueries({ queryKey: ['backgroundConfigs'] });
      await queryClient.invalidateQueries({ queryKey: ['backgroundConfigs', selectedPage] });
      
      // 2. Remover cache do navegador
      await queryClient.removeQueries({ queryKey: ['backgroundConfigs'] });
      
      // 3. Forçar refetch
      await refetch();
      
      // 4. Limpar localStorage se houver
      try {
        localStorage.removeItem('background_cache');
        sessionStorage.clear();
      } catch (e) {
        console.log('Cache storage já limpo');
      }
      
      // 5. Mostrar toast
      toast({ 
        title: '✅ Background Salvo com Sucesso!', 
        description: `Config ID: ${newConfig.id} | Página: ${selectedPage}`,
        duration: 4000 
      });
      
      // 6. Aguardar um pouco e recarregar FORÇADAMENTE
      setTimeout(() => {
        console.log('🔄 RECARREGANDO PÁGINA FORÇADAMENTE...');
        window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
      }, 1000);
      
      setPreviewMode(false);
    },
    onError: (error) => {
      console.error('❌ ERRO AO SALVAR:', error);
      toast({ 
        title: '❌ Erro ao salvar', 
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
        duration: 5000
      });
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Editor de Background</h2>
              <p className="text-slate-300 text-sm">Personalize imagens, vídeos, cores e animações</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPreviewMode(!previewMode)}
              variant="outline"
              className="bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Editar' : 'Preview'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Background
            </Button>
          </div>
        </div>

        {/* Page Selector */}
        <div className="mb-6">
          <Label className="text-slate-300 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Selecione a Página
          </Label>
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {PAGES.map(page => (
                <SelectItem key={page.id} value={page.id} className="text-white">
                  {page.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeConfig && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 border mt-2">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Configuração ativa
            </Badge>
          )}
        </div>

        {!previewMode ? (
          <Tabs defaultValue="background" className="w-full">
            <TabsList className="bg-slate-800/50 border-slate-700 mb-6">
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="logo">Logo</TabsTrigger>
              <TabsTrigger value="colors">Cores/Gradiente</TabsTrigger>
              <TabsTrigger value="animation">Animação</TabsTrigger>
            </TabsList>

            <TabsContent value="background" className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-2">Tipo de Background</Label>
                <Select 
                  value={formData.background_type} 
                  onValueChange={(v) => setFormData({...formData, background_type: v})}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="image" className="text-white">Imagem</SelectItem>
                    <SelectItem value="video" className="text-white">Vídeo</SelectItem>
                    <SelectItem value="gradient" className="text-white">Gradiente</SelectItem>
                    <SelectItem value="solid" className="text-white">Cor Sólida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.background_type === "image" || formData.background_type === "video") && (
                <>
                  <div>
                    <Label className="text-slate-300 mb-2">
                      {formData.background_type === "image" ? "URL da Imagem" : "URL do Vídeo"}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.background_url}
                        onChange={(e) => setFormData({...formData, background_url: e.target.value})}
                        placeholder="https://..."
                        className="flex-1 bg-slate-800/50 border-slate-700 text-white"
                      />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept={formData.background_type === "image" ? "image/*" : "video/*"}
                          onChange={(e) => handleFileUpload(e, 'background_url')}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingFile}
                          className="bg-blue-500/20 border-blue-500/50 text-blue-400"
                          asChild
                        >
                          <span>
                            {uploadingFile ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-slate-300">Opacidade do Background</Label>
                      <span className="text-white font-bold text-sm">{(formData.background_opacity * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[formData.background_opacity * 100]}
                      onValueChange={(v) => setFormData({...formData, background_opacity: v[0] / 100})}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {formData.background_url && (
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      <Label className="text-slate-400 text-xs mb-2 block">Preview</Label>
                      {formData.background_type === "image" ? (
                        <img 
                          src={formData.background_url} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded-lg"
                          style={{ opacity: formData.background_opacity }}
                        />
                      ) : (
                        <video 
                          src={formData.background_url} 
                          className="w-full h-32 object-cover rounded-lg"
                          style={{ opacity: formData.background_opacity }}
                          muted
                          loop
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="logo" className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-2">URL da Logo</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                    placeholder="https://..."
                    className="flex-1 bg-slate-800/50 border-slate-700 text-white"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo_url')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingFile}
                      className="bg-blue-500/20 border-blue-500/50 text-blue-400"
                      asChild
                    >
                      <span>
                        {uploadingFile ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-slate-300">Opacidade da Logo</Label>
                  <span className="text-white font-bold text-sm">{(formData.logo_opacity * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[formData.logo_opacity * 100]}
                  onValueChange={(v) => setFormData({...formData, logo_opacity: v[0] / 100})}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-slate-300">Tamanho da Logo</Label>
                  <span className="text-white font-bold text-sm">{formData.logo_size}px</span>
                </div>
                <Slider
                  value={[formData.logo_size]}
                  onValueChange={(v) => setFormData({...formData, logo_size: v[0]})}
                  min={200}
                  max={800}
                  step={50}
                  className="w-full"
                />
              </div>

              {formData.logo_url && (
                <div className="bg-slate-950 rounded-lg p-6 border border-slate-700/50 flex items-center justify-center">
                  <img 
                    src={formData.logo_url} 
                    alt="Logo Preview" 
                    style={{ 
                      width: `${formData.logo_size}px`,
                      opacity: formData.logo_opacity,
                      filter: 'brightness(0) invert(1)'
                    }}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              {formData.background_type === "solid" && (
                <div>
                  <Label className="text-slate-300 mb-2">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.solid_color}
                      onChange={(e) => setFormData({...formData, solid_color: e.target.value})}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.solid_color}
                      onChange={(e) => setFormData({...formData, solid_color: e.target.value})}
                      className="flex-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {formData.background_type === "gradient" && (
                <>
                  <div>
                    <Label className="text-slate-300 mb-2">Cor Inicial</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.gradient_from}
                        onChange={(e) => setFormData({...formData, gradient_from: e.target.value})}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.gradient_from}
                        onChange={(e) => setFormData({...formData, gradient_from: e.target.value})}
                        className="flex-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 mb-2">Cor Intermediária</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.gradient_via}
                        onChange={(e) => setFormData({...formData, gradient_via: e.target.value})}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.gradient_via}
                        onChange={(e) => setFormData({...formData, gradient_via: e.target.value})}
                        className="flex-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 mb-2">Cor Final</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.gradient_to}
                        onChange={(e) => setFormData({...formData, gradient_to: e.target.value})}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.gradient_to}
                        onChange={(e) => setFormData({...formData, gradient_to: e.target.value})}
                        className="flex-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-slate-300">Opacidade do Overlay</Label>
                  <span className="text-white font-bold text-sm">{(formData.overlay_opacity * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[formData.overlay_opacity * 100]}
                  onValueChange={(v) => setFormData({...formData, overlay_opacity: v[0] / 100})}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </TabsContent>

            <TabsContent value="animation" className="space-y-4">
              <div className="flex items-center justify-between bg-slate-800/30 rounded-lg p-4">
                <div>
                  <Label className="text-slate-300 font-semibold">Ativar Animação</Label>
                  <p className="text-slate-500 text-xs mt-1">Movimento suave do background</p>
                </div>
                <Switch
                  checked={formData.enable_animation}
                  onCheckedChange={(v) => setFormData({...formData, enable_animation: v})}
                />
              </div>

              {formData.enable_animation && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-slate-300">Duração da Animação</Label>
                    <span className="text-white font-bold text-sm">{formData.animation_duration}s</span>
                  </div>
                  <Slider
                    value={[formData.animation_duration]}
                    onValueChange={(v) => setFormData({...formData, animation_duration: v[0]})}
                    min={20}
                    max={120}
                    step={10}
                    className="w-full"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="bg-slate-950 rounded-xl overflow-hidden border-2 border-indigo-500/50 relative">
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-blue-500/90 text-white">PREVIEW MODE</Badge>
            </div>
            
            <div className="relative w-full h-96 overflow-hidden">
              {/* Base background */}
              {formData.background_type === "solid" && (
                <div className="absolute inset-0" style={{ backgroundColor: formData.solid_color }} />
              )}

              {formData.background_type === "gradient" && (
                <div 
                  className="absolute inset-0" 
                  style={{ 
                    background: `linear-gradient(to bottom right, ${formData.gradient_from}, ${formData.gradient_via}, ${formData.gradient_to})` 
                  }} 
                />
              )}

              {formData.background_type === "image" && formData.background_url && (
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${formData.background_url})`,
                    opacity: formData.background_opacity,
                    animation: formData.enable_animation ? `slowMove ${formData.animation_duration}s ease-in-out infinite alternate` : 'none'
                  }}
                />
              )}

              {formData.background_type === "video" && formData.background_url && (
                <video
                  src={formData.background_url}
                  autoPlay
                  muted
                  loop
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: formData.background_opacity }}
                />
              )}

              {/* Logo */}
              {formData.logo_url && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img
                    src={formData.logo_url}
                    alt="Logo"
                    style={{
                      width: `${formData.logo_size}px`,
                      height: `${formData.logo_size}px`,
                      opacity: formData.logo_opacity,
                      filter: 'brightness(0) invert(1)'
                    }}
                  />
                </div>
              )}

              {/* Overlay */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/70"
                style={{ opacity: formData.overlay_opacity }}
              />

              {/* Sample content */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <h1 className="text-4xl font-black text-white mb-2">Dashboard</h1>
                  <p className="text-slate-300">Preview do Background</p>
                </div>
              </div>
            </div>

            <style jsx>{`
              @keyframes slowMove {
                0% { transform: scale(1) translateX(0) translateY(0); }
                25% { transform: scale(1.08) translateX(-30px) translateY(-15px); }
                50% { transform: scale(1.05) translateX(-20px) translateY(-30px); }
                75% { transform: scale(1.08) translateX(-15px) translateY(-20px); }
                100% { transform: scale(1) translateX(0) translateY(0); }
              }
            `}</style>
          </div>
        )}
      </Card>
    </div>
  );
}