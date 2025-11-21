
import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Clock, User, Send, CheckCircle2, AlertCircle, Loader2, Star, Crown, Eye, Download, Sparkles, Bot } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function SupportPanel() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [viewingImages, setViewingImages] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const { data: ticketsData = [] } = useQuery({
    queryKey: ['supportTickets'],
    queryFn: () => base44.asServiceRole.entities.SupportTicket.list("-created_date"),
    refetchInterval: 10000
  });

  // Load AI conversation when ticket is selected
  useEffect(() => {
    const loadAIConversation = async () => {
      if (!selectedTicket) {
        setConversationId(null);
        setAiMessages([]);
        setIsAiTyping(false);
        return;
      }

      try {
        const conversations = await base44.agents.listConversations({
          agent_name: "support_assistant"
        });

        const ticketConv = conversations.find(c => c.metadata?.ticket_id === selectedTicket.id);
        
        if (ticketConv) {
          setConversationId(ticketConv.id);
          setAiMessages(ticketConv.messages || []);
          const lastMsg = ticketConv.messages?.[ticketConv.messages.length - 1];
          // If the last message is from the user, the AI might still be typing
          setIsAiTyping(lastMsg?.role === 'user');
        } else {
          // No existing conversation, clear previous AI state
          setConversationId(null);
          setAiMessages([]);
          setIsAiTyping(false);
        }
      } catch (error) {
        console.error("Error loading AI conversation:", error);
        setConversationId(null);
        setAiMessages([]);
        setIsAiTyping(false);
      }
    };

    loadAIConversation();
  }, [selectedTicket?.id]);

  // Subscribe to AI updates
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setAiMessages(data.messages || []);
      const lastMsg = data.messages?.[data.messages.length - 1];
      // Set typing state based on the last message role
      setIsAiTyping(lastMsg?.role === 'user' || (lastMsg?.role === 'assistant' && !lastMsg?.content)); // AI is typing if last message is user or assistant with no content yet
    });

    return () => unsubscribe();
  }, [conversationId]);

  const tickets = Array.isArray(ticketsData) ? ticketsData : [];

  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(t => t?.status === filterStatus);
    }
    
    if (filterPriority !== "all") {
      filtered = filtered.filter(t => t?.priority === filterPriority);
    }
    
    // VIP primeiro
    filtered.sort((a, b) => {
      if (a?.user_is_vip && !b?.user_is_vip) return -1;
      if (!a?.user_is_vip && b?.user_is_vip) return 1;
      
      // Depois por prioridade
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a?.priority] ?? 4;
      const bPriority = priorityOrder[b?.priority] ?? 4;
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Por fim, mais recentes
      return new Date(b?.created_date) - new Date(a?.created_date);
    });
    
    return filtered;
  }, [tickets, filterStatus, filterPriority]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }) => {
      const ticket = tickets.find(t => t.id === ticketId);
      
      await base44.asServiceRole.entities.SupportTicket.update(ticketId, {
        status,
        resolved_at: status === 'completed' || status === 'closed' ? new Date().toISOString() : null
      });

      // Notificar usuário
      const statusMessages = {
        in_analysis: "Seu ticket está sendo analisado pela equipe",
        waiting: "Seu ticket está aguardando informações adicionais",
        in_progress: "Estamos trabalhando na resolução do seu ticket",
        completed: "Seu ticket foi resolvido!",
        closed: "Seu ticket foi encerrado"
      };

      await base44.functions.invoke('createNotification', {
        userId: ticket.user_id,
        title: `Ticket #${ticketId.slice(-6)}: ${statusMessages[status]}`,
        message: `Status atualizado para: ${status.toUpperCase()}`,
        type: 'system',
        iconName: 'MessageSquare',
        priority: 'high'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    }
  });

  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      const ticket = selectedTicket;
      const messages = ticket?.messages || [];
      
      const newMessage = {
        from: "Suporte Scale Cripto",
        message: replyMessage,
        timestamp: new Date().toISOString(),
        is_admin: true
      };

      await base44.asServiceRole.entities.SupportTicket.update(ticket.id, {
        messages: [...messages, newMessage]
      });

      // Notificar usuário
      await base44.functions.invoke('createNotification', {
        userId: ticket.user_id,
        title: `Nova resposta no ticket #${ticket.id.slice(-6)}`,
        message: replyMessage.substring(0, 100) + (replyMessage.length > 100 ? '...' : ''),
        type: 'system',
        iconName: 'MessageSquare',
        priority: 'high'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      setReplyMessage("");
    }
  });

  const stats = {
    new: tickets.filter(t => t?.status === 'new').length,
    inProgress: tickets.filter(t => t?.status === 'in_progress' || t?.status === 'in_analysis').length,
    completed: tickets.filter(t => t?.status === 'completed' || t?.status === 'closed').length,
    vip: tickets.filter(t => t?.user_is_vip).length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-4">
          <div className="text-blue-300 text-xs mb-1">Novos</div>
          <div className="text-white font-black text-2xl">{stats.new}</div>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 p-4">
          <div className="text-yellow-300 text-xs mb-1">Em Andamento</div>
          <div className="text-white font-black text-2xl">{stats.inProgress}</div>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30 p-4">
          <div className="text-emerald-300 text-xs mb-1">Resolvidos</div>
          <div className="text-white font-black text-2xl">{stats.completed}</div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-4">
          <div className="text-purple-300 text-xs mb-1 flex items-center gap-1">
            <Crown className="w-3 h-3" />
            VIP
          </div>
          <div className="text-white font-black text-2xl">{stats.vip}</div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-4">
        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todos Status</SelectItem>
              <SelectItem value="new" className="text-white">Novos</SelectItem>
              <SelectItem value="in_analysis" className="text-white">Em Análise</SelectItem>
              <SelectItem value="waiting" className="text-white">Aguardando</SelectItem>
              <SelectItem value="in_progress" className="text-white">Em Andamento</SelectItem>
              <SelectItem value="completed" className="text-white">Concluídos</SelectItem>
              <SelectItem value="closed" className="text-white">Fechados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todas Prioridades</SelectItem>
              <SelectItem value="urgent" className="text-white">Urgente</SelectItem>
              <SelectItem value="high" className="text-white">Alta</SelectItem>
              <SelectItem value="medium" className="text-white">Média</SelectItem>
              <SelectItem value="low" className="text-white">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de Tickets */}
      <div className="space-y-3">
        {filteredTickets.map((ticket, idx) => (
          <motion.div
            key={ticket?.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card 
              className={`p-4 cursor-pointer transition-all ${
                ticket?.user_is_vip 
                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/40 hover:border-purple-500/60'
                  : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50'
              }`}
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="text-white font-bold text-sm truncate">{ticket?.subject}</h4>
                    {ticket?.user_is_vip && (
                      <Badge className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 border-purple-500/50 border">
                        <Crown className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <User className="w-3 h-3" />
                    <span>{ticket?.user_email}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(ticket?.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  </div>

                  <p className="text-slate-400 text-xs line-clamp-2">{ticket?.description}</p>
                </div>

                <div className="flex flex-col gap-2 items-end flex-shrink-0">
                  <Badge className={`${
                    ticket?.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                    ticket?.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                    ticket?.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                    'bg-blue-500/20 text-blue-400 border-blue-500/50'
                  } border text-xs`}>
                    {ticket?.priority?.toUpperCase()}
                  </Badge>

                  <Badge className={`${
                    ticket?.status === 'new' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                    ticket?.status === 'in_analysis' || ticket?.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                    ticket?.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' :
                    'bg-slate-500/20 text-slate-400 border-slate-500/50'
                  } border text-xs`}>
                    {ticket?.status?.replace('_', ' ').toUpperCase()}
                  </Badge>

                  {ticket?.messages?.length > 0 && (
                    <div className="text-xs text-slate-500">
                      {ticket.messages.length} mensagem{ticket.messages.length > 1 ? 's' : ''}
                    </div>
                  )}

                  {ticket?.attachments?.length > 0 && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-xs">
                      📎 {ticket.attachments.length} imagem{ticket.attachments.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p>Nenhum ticket encontrado</p>
          </div>
        )}
      </div>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedTicket} onOpenChange={() => {
        setSelectedTicket(null);
        setConversationId(null);
        setAiMessages([]);
        setIsAiTyping(false);
      }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Ticket #{selectedTicket.id.slice(-6)}
                  {selectedTicket.user_is_vip && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 ml-2">
                      <Crown className="w-3 h-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1">Usuário</div>
                    <div className="text-white text-sm font-semibold">{selectedTicket.user_email}</div>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1">Categoria</div>
                    <div className="text-white text-sm font-semibold">{selectedTicket.category}</div>
                  </div>
                </div>

                <div className="bg-slate-800/20 rounded-lg p-4">
                  <div className="text-slate-400 text-xs mb-2">Assunto</div>
                  <h3 className="text-white font-bold text-lg">{selectedTicket.subject}</h3>
                  <p className="text-slate-300 text-sm mt-3">{selectedTicket.description}</p>
                </div>

                {/* Imagens Anexadas */}
                {selectedTicket.attachments?.length > 0 && (
                  <div className="bg-slate-800/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-semibold flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Imagens Anexadas pelo Usuário
                      </h4>
                      <Button
                        size="sm"
                        onClick={() => setViewingImages(selectedTicket.attachments)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400"
                      >
                        Ver Todas
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedTicket.attachments.map((url, idx) => (
                        <div 
                          key={idx}
                          className="relative group cursor-pointer"
                          onClick={() => setViewingImages([url])}
                        >
                          <img 
                            src={url} 
                            alt={`Anexo ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-slate-600 hover:border-blue-500 transition-all"
                          />
                          <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Controls */}
                <div className="flex gap-2 flex-wrap">
                  {['in_analysis', 'waiting', 'in_progress', 'completed', 'closed'].map(status => (
                    <Button
                      key={status}
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ ticketId: selectedTicket.id, status })}
                      className={`${
                        selectedTicket.status === status 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {status === 'in_analysis' && '🔍 Em Análise'}
                      {status === 'waiting' && '⏳ Aguardando'}
                      {status === 'in_progress' && '⚙️ Em Andamento'}
                      {status === 'completed' && '✅ Concluído'}
                      {status === 'closed' && '🔒 Encerrado'}
                    </Button>
                  ))}
                </div>

                {/* Mensagens - Ticket + AI Integrado */}
                <div className="bg-slate-800/20 rounded-lg p-4 max-h-80 overflow-y-auto space-y-3">
                  {/* Mensagens do Ticket */}
                  {selectedTicket.messages?.map((msg, idx) => (
                    <div key={`ticket-${idx}`} className={`${msg.is_admin ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block max-w-[80%] rounded-lg p-3 ${
                        msg.is_admin 
                          ? 'bg-blue-500/20 border border-blue-500/30' 
                          : 'bg-slate-700/30 border border-slate-600/30'
                      }`}>
                        <div className="text-xs text-slate-400 mb-1">{msg.from}</div>
                        <p className="text-white text-sm">{msg.message}</p>
                        <div className="text-xs text-slate-500 mt-1">
                          {format(new Date(msg.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Mensagens da IA */}
                  {aiMessages.filter(m => m.role === 'assistant' && m.content).map((msg, idx) => (
                    <motion.div
                      key={`ai-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-left"
                    >
                      <div className="inline-block max-w-[85%] rounded-lg p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                        <div className="text-xs text-purple-400 mb-2 font-semibold flex items-center gap-1">
                          <Bot className="w-3.5 h-3.5" />
                          Assistente iA (Automático)
                        </div>
                        <ReactMarkdown
                          className="text-white text-sm prose prose-sm prose-invert max-w-none"
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold text-purple-300">{children}</strong>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  ))}

                  {isAiTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-left"
                    >
                      <div className="inline-block rounded-lg p-3 bg-purple-500/10">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-purple-400 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Responder */}
                <div>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Digite sua resposta (suporte humano)..."
                    className="bg-slate-800/50 border-slate-700 text-white min-h-24"
                  />
                  <Button
                    onClick={() => sendReplyMutation.mutate()}
                    disabled={!replyMessage || sendReplyMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600 text-white mt-2"
                  >
                    {sendReplyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Enviar Resposta (Humano)
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTicket(null);
                    setConversationId(null);
                    setAiMessages([]);
                    setIsAiTyping(false);
                  }}
                  className="bg-slate-800/50 border-slate-700 text-white"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Visualizar Imagens */}
      <Dialog open={!!viewingImages} onOpenChange={() => setViewingImages(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Análise de Imagens do Ticket
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {viewingImages?.map((url, idx) => (
              <div key={idx} className="bg-slate-800/30 rounded-lg p-4">
                <img 
                  src={url} 
                  alt={`Imagem ${idx + 1}`}
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Imagem {idx + 1} de {viewingImages.length}</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Original
                  </a>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingImages(null)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
