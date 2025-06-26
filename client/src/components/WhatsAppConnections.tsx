import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Plus, Unlink2, QrCode, Smartphone, AlertTriangle } from "lucide-react";
import { getConnectionStatusColor, getConnectionStatusIcon, formatPhoneNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { WhatsappConnection } from "@shared/schema";

export default function WhatsAppConnections() {
  const { toast } = useToast();
  const [selectedConnection, setSelectedConnection] = useState<WhatsappConnection | null>(null);
  const [showQrDialog, setShowQrDialog] = useState(false);
  
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['/api/whatsapp-connections'],
    refetchInterval: 2000
  });

  const createConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/whatsapp-connections', {
        name: `WhatsApp #${connections.length + 1}`,
        status: 'disconnected'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp-connections'] });
      toast({
        title: "Conexão Criada",
        description: "Nova conexão WhatsApp criada. Escaneie o QR Code para conectar."
      });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/whatsapp-connections/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp-connections'] });
      toast({
        title: "Conexão Desconectada",
        description: "WhatsApp desconectado com sucesso."
      });
    }
  });

  const forceDisconnectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/whatsapp-connections/${id}/force-disconnect`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp-connections'] });
      toast({
        title: "Forçar Desconexão",
        description: "Conexão forçadamente desconectada e sessão limpa."
      });
    }
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/whatsapp-connections/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp-connections'] });
      toast({
        title: "Conexão Removida",
        description: "Conexão WhatsApp removida com sucesso."
      });
    }
  });

  const reconnectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/whatsapp-connections/${id}/reconnect`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp-connections'] });
      toast({
        title: "Reconectando",
        description: "Iniciando nova conexão WhatsApp..."
      });
    }
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Erro';
      default:
        return 'Desconectado';
    }
  };

  const renderConnectionSlot = (connection: WhatsappConnection | null, index: number) => {
    if (connection) {
      return (
        <Card key={connection.id} className="p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">{connection.name}</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                connection.status === 'connected' ? 'bg-green-500' :
                connection.status === 'connecting' ? 'bg-yellow-500' :
                connection.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
              <span className={`text-xs ${
                connection.status === 'connected' ? 'text-green-600' :
                connection.status === 'connecting' ? 'text-yellow-600' :
                connection.status === 'error' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {getStatusText(connection.status)}
              </span>
            </div>
          </div>
          
          {connection.phoneNumber && (
            <div className="text-xs text-gray-600 mb-3">
              {formatPhoneNumber(connection.phoneNumber)}
            </div>
          )}

          {connection.status === 'connecting' && connection.qrCode && (
            <div className="bg-white p-3 rounded border border-gray-200 mb-3 flex items-center justify-center">
              <img 
                src={`data:image/png;base64,${connection.qrCode}`} 
                alt="QR Code"
                className="w-24 h-24"
              />
            </div>
          )}

          {connection.status === 'connecting' && !connection.qrCode && (
            <div className="bg-white p-3 rounded border border-gray-200 mb-3 flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                <QrCode className="text-gray-400 w-6 h-6" />
              </div>
            </div>
          )}

          {connection.status === 'connecting' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 text-center">Escaneie o QR Code no WhatsApp</p>
              <Button
                onClick={() => showQrCode(connection)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <QrCode className="w-4 h-4 mr-1" />
                Ver QR Code
              </Button>
            </div>
          )}

          {connection.status !== 'disconnected' && (
            <div className="space-y-2">
              <Button
                onClick={() => disconnectMutation.mutate(connection.id)}
                disabled={disconnectMutation.isPending}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Unlink2 className="w-3 h-3 mr-1" />
                Desconectar
              </Button>
              
              <Button
                onClick={() => forceDisconnectMutation.mutate(connection.id)}
                disabled={forceDisconnectMutation.isPending}
                variant="outline"
                size="sm"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Forçar Desconexão
              </Button>
            </div>
          )}

          {connection.status === 'disconnected' && (
            <div className="space-y-2">
              <Button
                onClick={() => reconnectMutation.mutate(connection.id)}
                disabled={reconnectMutation.isPending}
                variant="default"
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <QrCode className="w-3 h-3 mr-1" />
                Conectar WhatsApp
              </Button>
              
              <Button
                onClick={() => deleteConnectionMutation.mutate(connection.id)}
                disabled={deleteConnectionMutation.isPending}
                variant="outline"
                size="sm"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Remover Conexão
              </Button>
            </div>
          )}
        </Card>
      );
    }

    // Empty slot
    if (connections.length < 20) {
      return (
        <Card 
          key={`slot-${index}`}
          className="p-4 border-dashed border-gray-300 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => createConnectionMutation.mutate()}
        >
          <div className="flex flex-col items-center justify-center h-full text-gray-400 hover:text-gray-600">
            <Plus className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Conectar WhatsApp</span>
            <span className="text-xs">Slot #{index + 1}</span>
          </div>
        </Card>
      );
    }

    return (
      <Card key={`disabled-slot-${index}`} className="p-4 border-dashed border-gray-300 bg-white opacity-50">
        <div className="flex flex-col items-center justify-center h-full text-gray-300">
          <Plus className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">Slot #{index + 1}</span>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Carregando conexões...</div>;
  }

  const showQrCode = (connection: WhatsappConnection) => {
    setSelectedConnection(connection);
    setShowQrDialog(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 20 }, (_, index) => {
          const connection = connections[index] || null;
          return renderConnectionSlot(connection, index);
        })}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Conectar WhatsApp
            </DialogTitle>
          </DialogHeader>
          
          {selectedConnection && (
            <div className="text-center space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {selectedConnection.name}
                </h3>
                
                {selectedConnection.status === 'connecting' && selectedConnection.qrCode ? (
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded border">
                      <img 
                        src={selectedConnection.qrCode.startsWith('data:') ? selectedConnection.qrCode : `data:image/png;base64,${selectedConnection.qrCode}`}
                        alt="QR Code WhatsApp"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>1. Abra o WhatsApp no seu celular</p>
                      <p>2. Toque em Menu ou Configurações</p>
                      <p>3. Toque em Aparelhos conectados</p>
                      <p>4. Toque em Conectar um aparelho</p>
                      <p>5. Aponte seu telefone para esta tela</p>
                    </div>
                  </div>
                ) : selectedConnection.status === 'connected' ? (
                  <div className="text-green-600">
                    <Smartphone className="w-12 h-12 mx-auto mb-2" />
                    <p className="font-semibold">Conectado com sucesso!</p>
                    <p className="text-sm">
                      {formatPhoneNumber(selectedConnection.phoneNumber || '')}
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <p>Iniciando conexão...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
