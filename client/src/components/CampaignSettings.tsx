import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Info } from "lucide-react";

export default function CampaignSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/campaign-settings']
  });

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      minInterval: 30,
      maxInterval: 120,
      rotationType: 'sequential',
      randomizeMessages: true,
      skipErrors: false,
      logMessages: true
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', '/api/campaign-settings', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaign-settings'] });
    }
  });

  useEffect(() => {
    if (settings) {
      reset({
        minInterval: settings.minInterval,
        maxInterval: settings.maxInterval,
        rotationType: settings.rotationType,
        randomizeMessages: settings.randomizeMessages,
        skipErrors: settings.skipErrors,
        logMessages: settings.logMessages
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: any) => {
    updateSettingsMutation.mutate(data);
  };

  const watchedValues = watch();

  if (isLoading) {
    return <div className="text-center text-gray-500">Carregando configurações...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Timing Settings */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-3">
          Intervalo entre Mensagens
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="block text-xs text-gray-600 mb-1">Mínimo (segundos)</Label>
            <Input
              type="number"
              min="1"
              max="3600"
              {...register('minInterval', { valueAsNumber: true })}
            />
          </div>
          <div>
            <Label className="block text-xs text-gray-600 mb-1">Máximo (segundos)</Label>
            <Input
              type="number"
              min="1"
              max="3600"
              {...register('maxInterval', { valueAsNumber: true })}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center">
          <Info className="w-3 h-3 mr-1" />
          O sistema irá aguardar um tempo aleatório entre os valores configurados
        </p>
      </div>

      {/* Round Robin Settings */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-3">
          Sistema de Rodízio
        </Label>
        <RadioGroup 
          value={watchedValues.rotationType} 
          onValueChange={(value) => setValue('rotationType', value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sequential" id="sequential" />
            <Label htmlFor="sequential" className="text-sm text-gray-700">
              Sequencial (1→2→3→1)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="random" id="random" />
            <Label htmlFor="random" className="text-sm text-gray-700">
              Aleatório
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Message Distribution */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-3">
          Distribuição de Mensagens
        </Label>
        <div className="flex items-center space-x-2">
          <Switch
            checked={watchedValues.randomizeMessages}
            onCheckedChange={(checked) => setValue('randomizeMessages', checked)}
          />
          <Label className="text-sm text-gray-700">
            Alternar variações aleatoriamente
          </Label>
        </div>
      </div>

      {/* Advanced Settings */}
      <Card className="p-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Configurações Avançadas</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              checked={watchedValues.skipErrors}
              onCheckedChange={(checked) => setValue('skipErrors', checked)}
            />
            <Label className="text-sm text-gray-700">
              Pular números com erro
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={watchedValues.logMessages}
              onCheckedChange={(checked) => setValue('logMessages', checked)}
            />
            <Label className="text-sm text-gray-700">
              Registrar logs de envio
            </Label>
          </div>
        </div>
      </Card>

      <Button 
        type="submit" 
        disabled={updateSettingsMutation.isPending}
        className="w-full"
      >
        {updateSettingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </form>
  );
}
