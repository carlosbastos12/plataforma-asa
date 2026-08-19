# Banco de dados — Central Financeira (projeto Supabase "Plataforma ASA")

Runbook para colocar a Central Financeira no ar. São 4 passos e leva ~10 minutos.

> **Regra de segurança:** nenhuma chave é gravada neste repositório. A chave
> `service_role` **nunca** deve ser usada na aplicação nem colada em arquivo
> versionado — ela ignora o RLS e dá acesso total ao banco.

---

## 1. Aplicar o schema

1. Abra o **Supabase Dashboard** → projeto **Plataforma ASA** → **SQL Editor**.
2. Cole o conteúdo inteiro de [`migrations/0001_central_financeira.sql`](migrations/0001_central_financeira.sql).
3. Clique em **Run**.

O script é idempotente — pode ser executado de novo sem duplicar nada.

Ele cria:

| Objeto | Para quê |
|---|---|
| `perfis` | Quem é o usuário e o que ele pode ver (inclui `pode_ver_particular`) |
| `fornecedores`, `estabelecimentos`, `bancos`, `classificacoes` | Cadastros reutilizáveis — "cadastrar uma vez" |
| `contas` → `parcelas` → `pagamentos` → `documentos` | O núcleo, na hierarquia exigida pelo cliente |
| `historico_alteracoes` + gatilhos | Quem mudou valor, vencimento, classificação e pagamento |
| `vw_parcelas_completo` | Visão consolidada com **status calculado** (nunca digitado) |
| Políticas de RLS | Conta particular só existe para quem tem permissão |
| Seed | 4 estabelecimentos, 6 bancos e **96 classificações** (95 reais + Combustível) |

---

## 2. Configurar as variáveis de ambiente

Copie `frontend/.env.example` para `frontend/.env.local` e preencha com
**Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<a chave anon/public>
```

Na **Vercel**, as mesmas duas variáveis precisam ser cadastradas em
*Settings → Environment Variables* (Production e Preview).

---

## 3. Criar os usuários

No Dashboard → **Authentication → Users → Add user**, criando com
**e-mail e senha** (marque *Auto Confirm User*, para não depender de envio
de e-mail).

Sugestão para a demonstração:

| E-mail | Papel | Vê contas particulares? |
|---|---|---|
| `priscila@asareboques.com.br` | gestora | **Sim** |
| `administrativo@asareboques.com.br` | administrativo | Não |

Depois de criar, rode no **SQL Editor** para definir nome e permissões
(o perfil é criado automaticamente por gatilho, mas nasce como `consulta`):

```sql
-- Gestora: acesso total, incluindo as contas particulares
update perfis
set nome = 'Priscila', papel = 'gestora', pode_ver_particular = true
where id = (select id from auth.users where email = 'priscila@asareboques.com.br');

-- Administrativo/Contas a Pagar: opera o dia a dia, sem ver as particulares
update perfis
set nome = 'Administrativo', papel = 'administrativo', pode_ver_particular = false
where id = (select id from auth.users where email = 'administrativo@asareboques.com.br');

-- Conferência
select p.nome, p.papel, p.pode_ver_particular, u.email
from perfis p join auth.users u on u.id = p.id;
```

---

## 4. Verificar a separação Empresa × Particular

O teste que importa: entre como **administrativo** e confirme que

- a aba **Contas Particulares** não aparece na navegação;
- a opção **Particular** fica desabilitada no cadastro;
- o relatório de particulares fica bloqueado.

Isso é garantido pelo **RLS no banco**, não pela interface — mesmo uma
chamada direta à API com a chave `anon` devolve vazio para quem não tem
`pode_ver_particular`.

---

## Pendências registradas (não são esquecimento)

- **Classificação "Combustível"** — o cliente pediu (§23 do documento de
  requisitos), mas ela não existe na estrutura do escritório contábil, que
  só tem "Vale Combustível" (benefício a funcionário, outra coisa). Foi
  criada em `ADMINISTRATIVAS` com `confirmacao_pendente = true` e aparece
  na interface como "(a confirmar)". **Confirmar o grupo com o contador.**
- **Upload de documentos / Google Drive** — a tabela `documentos` já existe
  e está relacionada, mas nada é enviado ainda. Fica para missão futura.
- **Importação do AUTEM** — não implementada: ainda não temos uma amostra
  real do arquivo exportado.
- **Geração automática de contas recorrentes** — o cadastro já guarda tipo,
  periodicidade e nº de ocorrências; a criação automática das próximas
  ocorrências fica para depois.
