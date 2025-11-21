import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PublishStudyDialog({ open, onOpenChange, trade }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publishMutation = useMutation({
    mutationFn: async (studyData) => {
      const response = await base44.functions.invoke('publishAdminStudy', studyData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStudies'] });
      toast({
        title: "✅ Estudo Publicado!",
        description: "O estudo foi enviado para todos os usuários.",
        duration: 3000,
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "❌ Erro ao Publicar",
        description: error.message || "Não foi possível publicar o estudo.",
        duration: 5000,
      });
    }
  });

  const handleUploadMedia = async (file) => {
    if (!file) return;
    
    setUploading(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setMediaUrl(response.file_url);
      toast({
        title: "✅ Arquivo Enviado",
        description: "Mídia adicionada ao estudo.",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "❌ Erro no Upload",
        description: "Não foi possível enviar o arquivo.",
        duration: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!title || !trade) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha o título do estudo.",
        duration: 3000,
      });
      return;
    }

    const studyData = {
      title,
      description,
      pair: trade.pair,
      type: trade.type,
      entry_price: trade.entry_price,
      take_profit: trade.take_profit,
      stop_loss: trade.stop_loss,
      leverage: trade.leverage || 1,
      entry_amount: trade.entry_amount || 0,
      media_url: mediaUrl,
      original_trade_id: trade.id,
      cost_credits: 20
    };

    publishMutation.mutate(studyData);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMediaFile(null);
    setMediaUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Publicar Estudo de Performance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-300 text-sm mb-2">Título do Estudo *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Análise Técnica BTC em Consolidação"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm mb-2">Descrição e Notas</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a estratégia, contexto de mercado, razões da análise..."
              className="bg-slate-800/50 border-slate-700 text-white h-32"
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm mb-2">Mídia (Imagem/Vídeo) - Opcional</Label>
            {mediaUrl ? (
              <div className="relative">
                <img src={mediaUrl} alt="Preview" className="w-full rounded-lg" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setMediaUrl("");
                    setMediaFile(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setMediaFile(file);
                      handleUploadMedia(file);
                    }
                  }}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    {uploading ? "Enviando..." : "Clique para fazer upload"}
                  </p>
                </label>
              </div>
            )}
          </div>

          {trade && (
            <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
              <p className="text-slate-400 text-xs mb-2">Dados do Trade:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Par:</span>
                  <span className="text-white ml-2 font-semibold">{trade.pair}</span>
                </div>
                <div>
                  <span className="text-slate-500">Tipo:</span>
                  <span className="text-white ml-2 font-semibold">{trade.type}</span>
                </div>
                <div>
                  <span className="text-slate-500">Entrada:</span>
                  <span className="text-white ml-2 font-semibold">${trade.entry_price?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Alavancagem:</span>
                  <span className="text-white ml-2 font-semibold">{trade.leverage || 1}x</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
            <p className="text-orange-400 text-xs">
              <strong>Aviso:</strong> Este estudo será publicado para todos os usuários. 
              Usuários FREE/PRO/PRO+ pagarão C$20 para visualizar. 
              Infinity PRO e Enterprise têm acesso ilimitado.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={publishMutation.isPending || !title}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {publishMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Publicando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Publicar Estudo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}