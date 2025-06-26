import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function CampaignStatus() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/campaign/stats'],
    refetchInterval: 2000
  });

  const { data: settings } = useQuery({
    queryKey: ['/api/campaign-settings'],
    refetchInterval: 2000
  });

  if (isLoading) {
    return <div className="text-center text-gray-500">Carregando status...</div>;
  }

  if (!stats) {
    return <div className="text-center text-gray-500">Nenhum dado disponível</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-3 bg-green-50 border-green-200 text-center">
          <div className="text-lg font-semibold text-green-700">{stats.sent}</div>
          <div className="text-xs text-green-600">Enviadas</div>
        </Card>
        <Card className="p-3 bg-blue-50 border-blue-200 text-center">
          <div className="text-lg font-semibold text-blue-700">{stats.pending}</div>
          <div className="text-xs text-blue-600">Pendentes</div>
        </Card>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-3 bg-red-50 border-red-200 text-center">
          <div className="text-lg font-semibold text-red-700">{stats.errors}</div>
          <div className="text-xs text-red-600">Erros</div>
        </Card>
        <Card className="p-3 bg-purple-50 border-purple-200 text-center">
          <div className="text-lg font-semibold text-purple-700">{stats.progress}%</div>
          <div className="text-xs text-purple-600">Progresso</div>
        </Card>
        <Card className="p-3 bg-orange-50 border-orange-200 text-center">
          <div className="text-lg font-semibold text-orange-700">{stats.activeConnections || 0}</div>
          <div className="text-xs text-orange-600">WhatsApp Ativo</div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Progress value={stats.progress} className="h-2" />

      {/* Current Activity */}
      <Card className="p-3 bg-gray-50 border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Status da Campanha:</span>
          <span className={`font-medium ${settings?.isRunning ? 'text-green-600' : 'text-red-600'}`}>
            {settings?.isRunning ? 'Executando' : 'Parada'}
          </span>
        </div>
        {settings?.isRunning && stats.pending > 0 && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Próximo envio:</span>
            <span className="font-medium text-orange-600">Em breve...</span>
          </div>
        )}
      </Card>
    </div>
  );
}
