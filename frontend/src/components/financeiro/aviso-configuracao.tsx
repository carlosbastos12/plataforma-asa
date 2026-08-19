import { DatabaseZap } from "lucide-react";
import { Panel, PanelBody } from "@/components/ui/panel";

/**
 * Estado honesto para quando o banco ainda não foi conectado nesta
 * instalação: em vez de quebrar com erro técnico, a tela diz o que falta.
 */
export function AvisoConfiguracao() {
  return (
    <Panel>
      <PanelBody className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-warning-soft text-warning">
          <DatabaseZap className="size-5" strokeWidth={2} />
        </div>
        <div className="max-w-md">
          <p className="text-[15px] font-semibold text-foreground">Central Financeira ainda não conectada</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Esta área trabalha com dados reais e precisa da conexão com o banco de dados. Assim que as
            credenciais forem configuradas no ambiente, o cadastro de contas, os relatórios e as exportações
            passam a funcionar aqui.
          </p>
        </div>
      </PanelBody>
    </Panel>
  );
}
