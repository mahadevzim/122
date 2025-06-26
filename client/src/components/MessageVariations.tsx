import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Image, X, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MessageVariation } from "@shared/schema";

export default function MessageVariations() {
  const { toast } = useToast();
  
  const { data: variations = [], isLoading } = useQuery({
    queryKey: ['/api/message-variations']
  });

  const updateVariationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MessageVariation> }) => {
      const response = await apiRequest('PUT', `/api/message-variations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/message-variations'] });
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/message-variations/${id}/image`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/message-variations'] });
      toast({
        title: "Imagem Carregada",
        description: "Imagem carregada com sucesso!"
      });
    },
    onError: () => {
      toast({
        title: "Erro no Upload",
        description: "Não foi possível carregar a imagem",
        variant: "destructive"
      });
    }
  });

  const removeImageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/message-variations/${id}/image`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/message-variations'] });
      toast({
        title: "Imagem Removida",
        description: "Imagem removida com sucesso!"
      });
    }
  });

  const handleTextChange = (id: number, text: string) => {
    updateVariationMutation.mutate({ id, data: { text } });
  };

  const handleEnabledChange = (id: number, enabled: boolean) => {
    updateVariationMutation.mutate({ id, data: { enabled } });
  };

  const handleSecondMessageChange = (id: number, secondMessage: string) => {
    updateVariationMutation.mutate({ id, data: { secondMessage } });
  };

  const handleSecondMessageEnabledChange = (id: number, sendSecondMessage: boolean) => {
    updateVariationMutation.mutate({ id, data: { sendSecondMessage } });
  };

  const handleSecondMessageDelayChange = (id: number, secondMessageDelay: number) => {
    updateVariationMutation.mutate({ id, data: { secondMessageDelay } });
  };

  const handleImageUpload = (id: number, file: File) => {
    uploadImageMutation.mutate({ id, file });
  };

  const handleRemoveImage = (id: number) => {
    removeImageMutation.mutate(id);
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Carregando variações...</div>;
  }

  return (
    <div className="space-y-6">
      {variations.map((variation: MessageVariation) => (
        <Card key={variation.id} className="p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Variação #{variation.variationNumber}
            </h3>
            <div className="flex items-center space-x-2">
              <Label htmlFor={`enabled-${variation.id}`} className="text-sm text-gray-600">
                Ativa
              </Label>
              <Switch
                id={`enabled-${variation.id}`}
                checked={variation.enabled}
                onCheckedChange={(enabled) => handleEnabledChange(variation.id, enabled)}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem de Texto
              </Label>
              <Textarea
                value={variation.text || ''}
                onChange={(e) => handleTextChange(variation.id, e.target.value)}
                placeholder="Digite sua mensagem aqui... Use {variavel1} e {variavel2} para personalizar com os dados do contato"
                className="w-full resize-none"
                rows={3}
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Imagem (Opcional)
              </Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`image-${variation.id}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(variation.id, file);
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`image-${variation.id}`}
                    className="flex items-center justify-center w-full px-3 py-2 border border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Selecionar imagem</span>
                  </Label>
                </div>
                <div className="relative w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                  {variation.imageUrl ? (
                    <>
                      <img 
                        src={variation.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        onClick={() => handleRemoveImage(variation.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remover imagem"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <Image className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Second Message Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <Label className="text-sm font-medium text-gray-700">
                    Segunda Mensagem (Opcional)
                  </Label>
                </div>
                <Switch
                  checked={variation.sendSecondMessage || false}
                  onCheckedChange={(sendSecondMessage) => handleSecondMessageEnabledChange(variation.id, sendSecondMessage)}
                />
              </div>

              {variation.sendSecondMessage && (
                <div className="space-y-3">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Texto da Segunda Mensagem
                    </Label>
                    <Textarea
                      value={variation.secondMessage || ''}
                      onChange={(e) => handleSecondMessageChange(variation.id, e.target.value)}
                      placeholder="Digite a segunda mensagem... Esta será enviada se a primeira não for respondida"
                      className="w-full resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempo de Espera (segundos)
                    </Label>
                    <Input
                      type="number"
                      min="10"
                      max="3600"
                      value={variation.secondMessageDelay || 30}
                      onChange={(e) => handleSecondMessageDelayChange(variation.id, parseInt(e.target.value) || 30)}
                      className="w-32"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tempo para aguardar resposta antes de enviar a segunda mensagem
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
