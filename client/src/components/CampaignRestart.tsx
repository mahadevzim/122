import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RestartOptions {
  resetProgress: boolean;
  clearLogs: boolean;
  updateContacts: boolean;
}

export default function CampaignRestart() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<RestartOptions>({
    resetProgress: false,
    clearLogs: false,
    updateContacts: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const restartMutation = useMutation({
    mutationFn: async (restartOptions: RestartOptions) => {
      const response = await apiRequest('POST', '/api/campaign/restart', restartOptions);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaign/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaign-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaign-logs'] });
      
      setOpen(false);
      toast({
        title: "Campanha Reiniciada",
        description: data.message || "A campanha foi reiniciada com as configurações atualizadas!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Reiniciar Campanha",
        description: error.message || "Não foi possível reiniciar a campanha",
        variant: "destructive"
      });
    }
  });

  const handleRestart = () => {
    restartMutation.mutate(options);
  };

  const handleOptionChange = (option: keyof RestartOptions, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reiniciar Campanha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Reiniciar Campanha
          </DialogTitle>
          <DialogDescription>
            Escolha como reiniciar a campanha com as configurações e listas atualizadas.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="resetProgress"
              checked={options.resetProgress}
              onCheckedChange={(checked) => 
                handleOptionChange('resetProgress', checked as boolean)
              }
            />
            <label
              htmlFor="resetProgress"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Resetar progresso da campanha
            </label>
          </div>
          <div className="text-xs text-muted-foreground ml-6">
            Todos os contatos voltarão ao status "pendente" e a campanha recomeçará do início
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="clearLogs"
              checked={options.clearLogs}
              onCheckedChange={(checked) => 
                handleOptionChange('clearLogs', checked as boolean)
              }
            />
            <label
              htmlFor="clearLogs"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Limpar logs da campanha
            </label>
          </div>
          <div className="text-xs text-muted-foreground ml-6">
            Remove todos os logs anteriores da campanha
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="updateContacts"
              checked={options.updateContacts}
              onCheckedChange={(checked) => 
                handleOptionChange('updateContacts', checked as boolean)
              }
            />
            <label
              htmlFor="updateContacts"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Aplicar configurações atualizadas
            </label>
          </div>
          <div className="text-xs text-muted-foreground ml-6">
            A campanha será reiniciada com todas as configurações e variações de mensagem atuais
          </div>

          {options.resetProgress && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Atenção:</strong> Resetar o progresso fará com que mensagens sejam enviadas novamente para contatos que já receberam.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={restartMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRestart}
            disabled={restartMutation.isPending}
            className="gap-2"
          >
            {restartMutation.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Reiniciando...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Reiniciar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}