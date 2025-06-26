import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import { Trash2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RecentLogs() {
  const { toast } = useToast();
  
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['/api/campaign-logs'],
    refetchInterval: 10000
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/campaign-logs');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaign-logs'] });
      toast({
        title: "Logs Limpos",
        description: "Todos os logs foram removidos"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    if (status === 'sent') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <Check className="w-3 h-3 mr-1" />
          Enviado
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive">
        <X className="w-3 h-3 mr-1" />
        Erro
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Carregando logs...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div></div>
        {logs.length > 0 && (
          <Button
            onClick={() => clearLogsMutation.mutate()}
            disabled={clearLogsMutation.isPending}
            variant="outline"
            size="sm"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Limpar logs
          </Button>
        )}
      </div>
      
      {logs.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Nenhum log disponível
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatTime(new Date(log.sentAt))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.whatsapp?.name || `WA #${log.whatsappConnectionId}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.contact?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      Var #{log.variation?.variationNumber || log.messageVariationId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
