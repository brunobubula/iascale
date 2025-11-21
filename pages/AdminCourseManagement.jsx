import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Plus, Edit2, Trash2, ArrowLeft, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminCourseManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    module_title: "",
    module_order: 1,
    lesson_title: "",
    lesson_order: 1,
    lesson_type: "video",
    video_url: "",
    text_content: "",
    link_url: "",
    link_title: "",
    description: "",
    duration: "",
    is_published: true
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: courseContent = [], isLoading } = useQuery({
    queryKey: ['courseContent'],
    queryFn: () => base44.entities.CourseContent.list('-module_order'),
    initialData: [],
  });

  const createLessonMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseContent'] });
      setShowDialog(false);
      resetForm();
      alert("Aula criada com sucesso!");
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseContent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseContent'] });
      setShowDialog(false);
      setEditingLesson(null);
      resetForm();
      alert("Aula atualizada com sucesso!");
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseContent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseContent'] });
      alert("Aula deletada com sucesso!");
    },
  });

  const resetForm = () => {
    setFormData({
      module_title: "",
      module_order: 1,
      lesson_title: "",
      lesson_order: 1,
      lesson_type: "video",
      video_url: "",
      text_content: "",
      link_url: "",
      link_title: "",
      description: "",
      duration: "",
      is_published: true
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, data: formData });
    } else {
      createLessonMutation.mutate(formData);
    }
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      module_title: lesson.module_title || "",
      module_order: lesson.module_order || 1,
      lesson_title: lesson.lesson_title || "",
      lesson_order: lesson.lesson_order || 1,
      lesson_type: lesson.lesson_type || "video",
      video_url: lesson.video_url || "",
      text_content: lesson.text_content || "",
      link_url: lesson.link_url || "",
      link_title: lesson.link_title || "",
      description: lesson.description || "",
      duration: lesson.duration || "",
      is_published: lesson.is_published !== false
    });
    setShowDialog(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja deletar esta aula?")) {
      deleteLessonMutation.mutate(id);
    }
  };

  const handleNewLesson = () => {
    setEditingLesson(null);
    resetForm();
    setShowDialog(true);
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-red-800/50 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Acesso Negado</h2>
          <p className="text-slate-400">Apenas administradores podem acessar esta página.</p>
        </Card>
      </div>
    );
  }

  // Agrupa por módulos
  const modules = courseContent.reduce((acc, content) => {
    const moduleTitle = content.module_title;
    if (!acc[moduleTitle]) {
      acc[moduleTitle] = [];
    }
    acc[moduleTitle].push(content);
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("AdminSettings"))}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Gerenciar Curso Renda 20k
            </h1>
            <p className="text-slate-400">Adicione e gerencie módulos e aulas do curso</p>
          </div>

          <Button
            onClick={handleNewLesson}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Aula
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : courseContent.length === 0 ? (
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-12 text-center">
            <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white text-xl font-bold mb-2">Nenhuma Aula Cadastrada</h3>
            <p className="text-slate-400 mb-6">Comece criando a primeira aula do curso</p>
            <Button
              onClick={handleNewLesson}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Aula
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(modules).map(([moduleTitle, lessons]) => (
              <Card key={moduleTitle} className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden">
                <div className="p-6 border-b border-slate-800/50">
                  <h2 className="text-xl font-bold text-white">{moduleTitle}</h2>
                  <p className="text-slate-400 text-sm">{lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}</p>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {lessons.sort((a, b) => a.lesson_order - b.lesson_order).map((lesson) => (
                    <div key={lesson.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-semibold">{lesson.lesson_title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              lesson.is_published 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-slate-700/50 text-slate-400'
                            }`}>
                              {lesson.is_published ? 'Publicada' : 'Rascunho'}
                            </span>
                          </div>
                          {lesson.description && (
                            <p className="text-slate-400 text-sm mb-2">{lesson.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Tipo: {lesson.lesson_type}</span>
                            {lesson.duration && <span>Duração: {lesson.duration}</span>}
                            <span>Ordem: {lesson.lesson_order}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(lesson)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(lesson.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Criar/Editar */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                {editingLesson ? 'Editar Aula' : 'Nova Aula'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="module_title">Título do Módulo</Label>
                  <Input
                    id="module_title"
                    value={formData.module_title}
                    onChange={(e) => setFormData({...formData, module_title: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module_order">Ordem do Módulo</Label>
                  <Input
                    id="module_order"
                    type="number"
                    value={formData.module_order}
                    onChange={(e) => setFormData({...formData, module_order: parseInt(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson_title">Título da Aula</Label>
                  <Input
                    id="lesson_title"
                    value={formData.lesson_title}
                    onChange={(e) => setFormData({...formData, lesson_title: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson_order">Ordem da Aula</Label>
                  <Input
                    id="lesson_order"
                    type="number"
                    value={formData.lesson_order}
                    onChange={(e) => setFormData({...formData, lesson_order: parseInt(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson_type">Tipo de Conteúdo</Label>
                  <Select
                    value={formData.lesson_type}
                    onValueChange={(value) => setFormData({...formData, lesson_type: value})}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (ex: 15min)</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="15min"
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              {formData.lesson_type === 'video' && (
                <div className="space-y-2">
                  <Label htmlFor="video_url">URL do Vídeo (YouTube, Vimeo, etc)</Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              )}

              {formData.lesson_type === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="text_content">Conteúdo em Texto</Label>
                  <Textarea
                    id="text_content"
                    value={formData.text_content}
                    onChange={(e) => setFormData({...formData, text_content: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    rows={6}
                  />
                </div>
              )}

              {formData.lesson_type === 'link' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="link_title">Título do Link</Label>
                    <Input
                      id="link_title"
                      value={formData.link_title}
                      onChange={(e) => setFormData({...formData, link_title: e.target.value})}
                      placeholder="Recurso Adicional"
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link_url">URL do Link</Label>
                    <Input
                      id="link_url"
                      type="url"
                      value={formData.link_url}
                      onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                      placeholder="https://..."
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_published" className="cursor-pointer">Publicar aula</Label>
              </div>
            </form>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingLesson(null);
                  resetForm();
                }}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingLesson ? 'Atualizar' : 'Criar'} Aula
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}