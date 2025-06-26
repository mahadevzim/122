import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CloudUpload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactList() {
  const { toast } = useToast();
  const [uploadStats, setUploadStats] = useState<any>(null);
  
  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts']
  });

  const uploadContactsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload contacts');
      }
      
      return response.json();
    },
    onSuccess: (stats) => {
      setUploadStats(stats);
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Lista Carregada",
        description: `${stats.formatted} contatos formatados com sucesso!`
      });
    },
    onError: () => {
      toast({
        title: "Erro no Upload",
        description: "Não foi possível processar a lista de contatos",
        variant: "destructive"
      });
    }
  });

  const clearContactsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/contacts');
      return response.json();
    },
    onSuccess: () => {
      setUploadStats(null);
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Lista Limpa",
        description: "Todos os contatos foram removidos"
      });
    }
  });

  const handleFileUpload = (file: File) => {
    if (file.type !== 'text/plain') {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione um arquivo .txt",
        variant: "destructive"
      });
      return;
    }
    
    uploadContactsMutation.mutate(file);
  };

  const getContactStats = () => {
    if (uploadStats) {
      return uploadStats;
    }
    
    if (contacts.length > 0) {
      const sent = contacts.filter((c: any) => c.status === 'sent').length;
      const pending = contacts.filter((c: any) => c.status === 'pending').length;
      const errors = contacts.filter((c: any) => c.status === 'error').length;
      
      return {
        loaded: contacts.length,
        formatted: pending + sent,
        errors
      };
    }
    
    return { loaded: 0, formatted: 0, errors: 0 };
  };

  const stats = getContactStats();

  return (
    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          Upload de Lista (TXT)
        </Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            accept=".txt"
            className="hidden"
            id="contactList"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
          />
          <label htmlFor="contactList" className="cursor-pointer">
            <div className="space-y-2">
              <CloudUpload className="mx-auto w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Clique para fazer upload
                </span>
                {' '}ou arraste o arquivo aqui
              </p>
              <p className="text-xs text-gray-500">Apenas arquivos .txt</p>
            </div>
          </label>
        </div>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Formato do Arquivo</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <p>• Um contato por linha</p>
          <p>• Formato: Telefone,Variável1,Variável2</p>
          <p>• Ex: 11999999999,João Silva,Empresa ABC</p>
          <p>• Use {"{variavel1}"} e {"{variavel2}"} nas mensagens</p>
          <p>• Números serão formatados automaticamente</p>
        </div>
      </Card>

      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Status da Lista</h4>
          {contacts.length > 0 && (
            <Button
              onClick={() => clearContactsMutation.mutate()}
              disabled={clearContactsMutation.isPending}
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-600">{stats.loaded}</div>
            <div className="text-xs text-gray-600">Carregados</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">{stats.formatted}</div>
            <div className="text-xs text-gray-600">Formatados</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">{stats.errors}</div>
            <div className="text-xs text-gray-600">Erros</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
