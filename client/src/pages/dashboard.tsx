import { Smartphone, MessageSquare, Users, Settings, TrendingUp, History, MessageCircle } from "lucide-react";
import WhatsAppConnections from "@/components/WhatsAppConnections";
import MessageVariations from "@/components/MessageVariations";
import ContactList from "@/components/ContactList";
import CampaignSettings from "@/components/CampaignSettings";
import CampaignStatus from "@/components/CampaignStatus";
import RecentLogs from "@/components/RecentLogs";
import ReceivedMessages from "@/components/ReceivedMessages";
import CampaignRestart from "@/components/CampaignRestart";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();

  // Campaign stats query
  const { data: campaignStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/campaign/stats'],
    refetchInterval: 5000
  });

  // Campaign settings query
  const { data: campaignSettings } = useQuery({
    queryKey: ['/api/campaign-settings']
  });

  // Start campaign mutation
  const startCampaignMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/campaign/start');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaign/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaign-settings'] });
      toast({
        title: "Campanha Iniciada",
        description: "A campanha foi iniciada com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Iniciar Campanha",
        description: error.message || "Não foi possível iniciar a campanha",
        variant: "destructive"
      });
    }
  });

  // Pause campaign mutation
  const pauseCampaignMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/campaign/pause');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaign/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaign-settings'] });
      toast({
        title: "Campanha Pausada",
        description: "A campanha foi pausada com sucesso!"
      });
    }
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'campaign_started':
        case 'campaign_paused':
          queryClient.invalidateQueries({ queryKey: ['/api/campaign/stats'] });
          queryClient.invalidateQueries({ queryKey: ['/api/campaign-settings'] });
          break;
        case 'whatsapp_connection_created':
        case 'whatsapp_connection_deleted':
          queryClient.invalidateQueries({ queryKey: ['/api/whatsapp-connections'] });
          break;
        case 'message_variation_updated':
          queryClient.invalidateQueries({ queryKey: ['/api/message-variations'] });
          break;
        case 'contacts_uploaded':
        case 'contacts_cleared':
          queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
          break;
        case 'campaign_logs_cleared':
          queryClient.invalidateQueries({ queryKey: ['/api/campaign-logs'] });
          break;
      }
    }
  }, [lastMessage]);

  const getCampaignStatusText = () => {
    if (campaignSettings?.isRunning) {
      return "Campanha Ativa";
    }
    return "Campanha Parada";
  };

  const getCampaignStatusColor = () => {
    if (campaignSettings?.isRunning) {
      return "bg-green-500";
    }
    return "bg-gray-400";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              
              <h1 className="text-xl font-semibold text-gray-900">Bot de Campanhas WhatsApp</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getCampaignStatusColor()}`}></div>
                <span className="text-sm text-gray-600">{getCampaignStatusText()}</span>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => startCampaignMutation.mutate()}
                  disabled={startCampaignMutation.isPending || campaignSettings?.isRunning}
                  className="whatsapp-bg whatsapp-bg-hover text-white"
                >
                  <i className="fas fa-play mr-2"></i>
                  Iniciar Campanha
                </Button>
                <Button 
                  onClick={() => pauseCampaignMutation.mutate()}
                  disabled={pauseCampaignMutation.isPending || !campaignSettings?.isRunning}
                  variant="secondary"
                >
                  <i className="fas fa-pause mr-2"></i>
                  Pausar
                </Button>
                <CampaignRestart />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: WhatsApp Connections & Message Setup */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* WhatsApp Connections */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Smartphone className="text-green-500 mr-2 w-5 h-5" />
                Conexões WhatsApp (5 máximo)
              </h2>
              <WhatsAppConnections />
            </section>

            {/* Message Variations */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <MessageSquare className="text-blue-500 mr-2 w-5 h-5" />
                Variações de Mensagem (3 máximo)
              </h2>
              <MessageVariations />
            </section>
          </div>

          {/* Right Column: Campaign Settings & Contact List */}
          <div className="space-y-8">
            
            {/* Contact List */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Users className="text-purple-500 mr-2 w-5 h-5" />
                Lista de Contatos
              </h2>
              <ContactList />
            </section>

            {/* Campaign Settings */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Settings className="text-orange-500 mr-2 w-5 h-5" />
                Configurações da Campanha
              </h2>
              <CampaignSettings />
            </section>

            {/* Campaign Status */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="text-green-500 mr-2 w-5 h-5" />
                Status da Campanha
              </h2>
              <CampaignStatus />
            </section>
          </div>
        </div>

        {/* Recent Logs and Received Messages */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <History className="text-gray-500 mr-2 w-5 h-5" />
                Logs Recentes
              </h2>
            </div>
            <RecentLogs />
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ReceivedMessages />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 Bot de Campanhas WhatsApp - Todos os direitos reservados
            </div>
            <div className="text-sm text-gray-500">
              Versão 1.0.0
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
