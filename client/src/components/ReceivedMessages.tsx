import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { MessageCircle, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ReceivedMessages() {
  const { toast } = useToast();
  
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/received-messages'],
    refetchInterval: 10000
  });

  const clearMessagesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/received-messages');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/received-messages'] });
      toast({
        title: "Mensagens Limpas",
        description: "Todas as mensagens recebidas foram removidas"
      });
    }
  });

  if (isLoading) {
    return <div className="text-center text-gray-500">Carregando mensagens...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Mensagens Recebidas</h3>
        </div>
        {messages.length > 0 && (
          <Button
            onClick={() => clearMessagesMutation.mutate()}
            disabled={clearMessagesMutation.isPending}
            variant="outline"
            size="sm"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      
      {messages.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>Nenhuma mensagem recebida</p>
          <p className="text-sm text-gray-400 mt-1">
            As mensagens dos contatos que responderam à campanha aparecerão aqui
          </p>
        </Card>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {messages.map((message: any) => (
            <Card key={message.id} className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {message.whatsapp?.name || `WA #${message.whatsappConnectionId}`}
                  </Badge>
                  <span className="text-sm font-medium text-gray-900">
                    {message.contact?.name || message.phoneNumber}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTime(new Date(message.receivedAt))}
                </span>
              </div>
              <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                {message.messageBody}
              </div>
              {message.contact?.variable1 && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-medium">Var1:</span> {message.contact.variable1}
                  {message.contact?.variable2 && (
                    <>
                      {' | '}
                      <span className="font-medium">Var2:</span> {message.contact.variable2}
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}