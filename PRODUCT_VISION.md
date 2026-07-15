# Visão de Produto — Plataforma-ASA

> **Status:** rascunho inicial fundamentado na Auditoria-ASA, para validação do PM (ChatGPT) e do CEO (Carlos). Onde uma afirmação vem diretamente da auditoria, isso é indicado; onde é proposta de produto, também.

## Missão

Ser a camada complementar ao AUTEM que organiza e digitaliza tudo que hoje só existe em planilha, papel ou controle paralelo na operação da ASA — sem nunca competir com o AUTEM pelo papel de sistema principal.

## O problema (evidência da auditoria)

A Auditoria-ASA (`../Auditoria-ASA/Analise/`) mapeou a operação real da empresa e encontrou:
- **1.925 planilhas** em uso ativo, das quais uma fatia relevante resolve o mesmo tipo de problema de formas diferentes.
- **759 arquivos** só para o controle de Caixa Particular — um Excel novo por turno, sem consolidação.
- Vencimento de documento de frota (AET, IPVA, seguro, licenciamento, tacógrafo) **digitado manualmente em até 3 lugares** para o mesmo dado.
- Uma planilha de multas operando com **~30 mil fórmulas**, no limite prático do que o Excel aguenta.
- **Senhas de sistemas críticos** (incluindo o próprio AUTEM) guardadas em texto plano, em planilha compartilhada — risco de segurança confirmado como ativo, não histórico.
- Nenhuma tela ou painel único mostra a operação inteira para quem dirige a empresa — "relatório" hoje significa exportar do AUTEM e colar em Excel.

Fonte completa: `Auditoria-ASA/Analise/02_Inventario_de_Planilhas.md` a `05_Oportunidades_Encontradas.md`.

## Visão

Um usuário acostumado a Excel, papel e WhatsApp — sem formação técnica — abre a Plataforma-ASA e, em poucos segundos, entende **o que precisa da atenção dele agora**. Nenhuma tela exige treinamento. Nenhuma tela compete com o AUTEM.

## Para quem é

- **Usuário primário:** gestão operacional e administrativa da ASA (perfil não-técnico, alta familiaridade com Excel/papel/WhatsApp, baixa tolerância a complexidade).
- **Usuário de decisão:** direção da empresa — precisa de uma visão consolidada que hoje não existe em lugar nenhum.

## Princípios de produto

1. **Complementar, nunca substituto** — o AUTEM continua sendo a fonte de verdade operacional (acionamento, protocolo, contas a pagar). A Plataforma-ASA não compete com isso.
2. **Elimina, não acumula** — cada funcionalidade precisa eliminar uma planilha, um papel ou um controle paralelo real — documentado na auditoria, não hipotético.
3. **Autoexplicativo** — o sistema ensina o usuário no uso, não depende de treinamento prévio.
4. **Ação antes de gráfico** — prioriza mostrar o que precisa ser resolvido hoje, não decorar a tela com indicador.
5. **Confiança pelo dado real** — nenhuma tela deve implicar precisão que a fonte de dado não sustenta (lição da auditoria: nunca misturar identificador real com valor fictício em demonstração).

## O que este produto NÃO é (fora de escopo, por decisão já registrada na auditoria)

- Não é um ERP financeiro completo.
- Não é um sistema de RH/folha de pagamento.
- Não é um substituto do AUTEM para acionamento/protocolo ou contas a pagar.
- Não tenta migrar arquivos puramente históricos da empresa.

Justificativa detalhada: `Auditoria-ASA/Analise/06_Proposta_MVP.md` e `07_Visao_Tecnica_e_Roadmap.md`.

## Módulos candidatos (herdados da auditoria — sujeitos a validação do PM)

A auditoria já propôs 5 módulos candidatos ao primeiro produto, com problema, benefício e prioridade justificados: Central de Vencimentos da Frota, Gestão de Multas, Caixa Particular Consolidado, Cofre de Credenciais e Dashboard Executivo. Esta lista **não está automaticamente aprovada para a Plataforma-ASA** — é o ponto de partida da conversa com o PM, registrado aqui como referência. Ver `Auditoria-ASA/Analise/06_Proposta_MVP.md` para o detalhamento completo de cada um.

## Métricas de sucesso (propostas, a validar)

- Diretoria consegue, olhando uma única tela, dizer o que precisa de atenção hoje — sem abrir Excel.
- Redução mensurável no número de arquivos/controles paralelos que a auditoria já contou (ex.: os 759 arquivos de Caixa Particular).
- Zero treinamento formal necessário para o primeiro uso.
