/**
 * Regras de integridade financeira da Central Financeira.
 *
 * Ficam num módulo próprio — nem em `acoes.ts` (que é `"use server"` e só
 * pode exportar função assíncrona) nem dentro de um componente — para que
 * a MESMA regra sirva aos dois lados: a tela usa para mostrar/esconder o
 * campo e explicar o motivo, e a Server Action usa para decidir de fato.
 *
 * A tela nunca é a autoridade: ela só antecipa a resposta para o usuário
 * não perder tempo. Quem grava reconfere lendo o estado atual do banco.
 */

/** O que precisa ser sabido sobre uma conta para julgar a correção de valor. */
export interface EstadoConta {
  cancelada: boolean;
  /** Quantas linhas em `parcelas` esta conta tem. */
  totalParcelas: number;
  /** true se qualquer parcela desta conta já recebeu pagamento. */
  temPagamento: boolean;
}

export type Veredito = { pode: true } | { pode: false; motivo: string };

/**
 * Se o valor total de uma conta já cadastrada ainda pode ser corrigido.
 *
 * O total da conta (`contas.valor_inicial`) e o valor das parcelas
 * (`parcelas.valor`) precisam continuar contando a mesma história: é
 * `parcelas.valor` que decide o status (paga / parcialmente paga /
 * vencida, na view `vw_parcelas_completo`) e que soma nos relatórios.
 * Alterar um sem o outro deixaria a conta divergente de si mesma.
 *
 * Por isso o valor só é corrigível enquanto a conta está simples e
 * intacta — UMA parcela e NENHUM pagamento. Aí a correção é inequívoca:
 * o total e a única parcela recebem o mesmo número novo.
 *
 * Nos demais casos o campo fica bloqueado, com o motivo dito na tela:
 * - **com pagamento:** alterar o valor mudaria retroativamente o que já
 *   foi quitado (uma parcela paga viraria "parcialmente paga", ou o
 *   contrário) e desencontraria um fechamento já enviado à contabilidade;
 * - **parcelada:** não existe resposta única para redistribuir o novo
 *   total entre as parcelas — quem decide isso é quem tem o boleto na
 *   mão, não o sistema chutando uma divisão;
 * - **cancelada:** a conta é registro histórico, não muda mais.
 */
export function podeCorrigirValor(estado: EstadoConta): Veredito {
  if (estado.cancelada) {
    return { pode: false, motivo: "Esta conta está cancelada — o valor não pode mais ser alterado." };
  }
  if (estado.temPagamento) {
    return {
      pode: false,
      motivo: "O valor não pode ser alterado porque esta conta já possui pagamento registrado.",
    };
  }
  if (estado.totalParcelas > 1) {
    return {
      pode: false,
      motivo:
        "O valor total não pode ser alterado em conta parcelada — o sistema não teria como saber quanto ficaria em cada parcela.",
    };
  }
  return { pode: true };
}
