# Forma Fitness · Sistema web / PWA

Aplicação para os treinos de **Henrick** e **Cecília**, baseada nas fichas recebidas de 30/03/2026.
A pasta `web/` é independente do código Swift do aplicativo iOS, localizado na raiz do repositório.

## Estado atual (v2)
- Nove rotinas iniciais, incluindo séries de aquecimento, feeder, trabalho e top, com exercícios, repetições e descanso transcritos dos PDFs.
- Sessões independentes por atleta, inclusive simultâneas.
- Registro de cargas, repetições, RPE, notas e séries concluídas; cronômetro e retomada após recarregar.
- Dashboard e gráficos: volume, frequência, carga por exercício, 1RM estimado, recordes, peso, gordura corporal, IMC, cintura e outras medidas.
- Cardio: modalidade, tempo, distância, frequência cardíaca média e esforço.
- Editor de rotinas, calendário, histórico, exportação CSV e backup JSON restaurável.
- Atualização da PWA e fallback offline com cache de recursos.
- Login com e-mail e senha por Supabase Auth e sincronização entre dispositivos.
- Espaço compartilhável por convite único (64 caracteres, validade 7 dias); duas contas podem usar os mesmos dois perfis com permissões de membro.
- Sincronização com versão de estado (CAS), união de registros por ID e trilha de exclusões para evitar reaparecimento de itens deletados.

## Implantação e arquitetura
- O front-end é estático e hospedado na Vercel.
- A integração `cloud.js` comunica-se diretamente com Supabase via HTTPS, usando somente chave publicável.
- As tabelas `public.forma_*` ficam **logicamente separadas**, com RLS em todas as tabelas, da instalação Supabase do ContaFlux. Isso foi necessário devido ao limite de dois projetos gratuitos da conta, sem qualquer modificação das tabelas `cf_*`.
- Cada conta de login possui um UUID do Supabase Auth; membros só leem ou alteram `forma_data` no workspace ao qual pertencem.
- Convites são armazenados como SHA-256, podem ser usados uma vez e são validados em função RPC que exige autenticação.
- O corpo dos registros fica em JSONB com limite de 4 MiB por espaço; quando esse limite for alcançado, deve-se migrar para tabelas por evento.
- Os dados continuam em backup local do navegador, acessíveis pelo modo offline; em dispositivo compartilhado, use "Sair da conta" para apagar a cópia do espaço atual.

## Usar
1. Abrir a URL publicada em Safari, Chrome ou Edge.
2. Criar conta, confirmar o e-mail caso seja solicitado, e entrar com a senha.
3. Em Configurações, o responsável cria um convite. A outra pessoa cria sua própria conta, entra e cola o convite.
4. Alterar perfis entre Henrick e Cecília, registrar treinos e medidas.
5. Verificar que "● Sincronizado" aparece no cabeçalho; se aparecer "◌ Pendente", manter a página conectada até sincronizar.
6. Para uso sem conta, escolher "Continuar neste aparelho"; fazer backup JSON regularmente.

## Segurança e limites
- Dados corporais são dados pessoais sensíveis: manter senhas fortes, não publicar convites, verificar os dispositivos autorizados, proteger e-mail e fazer backups.
- O login da infraestrutura Supabase é compartilhado com a instalação ContaFlux, mas permissões de leitura dos dados do Forma são distintas por RLS. A separação é lógica, não física.
- O modo offline não é um banco criptografado; limpe a sessão em aparelhos de terceiros.
- A primeira autenticação real com contas finais precisa ser feita pelos titulares, por motivos óbvios de privacidade.
- A integração Apple Health/HealthKit e Bluetooth da balança OKOK requer aplicativo nativo e não é fornecida pela PWA.
- IMC, 1RM e estimativa de massa magra não substituem avaliação de profissional.

## Desenvolvimento e testes
```bash
cd web
python3 -m http.server 8000
npm run check
npm test
```
O workflow `.github/workflows/forma-web.yml` também executa Playwright Chromium, incluindo testes de interface móvel e autenticação com API mock. Esses testes não substituem um teste com conta real e dispositivo real.

Para rodar o navegador local:
```bash
cd web
npm install --no-save --package-lock=false @playwright/test@1.56.1
npx playwright install chromium
npx playwright test
```

## Esquema
`web/sql/forma_cloud.sql` contém DDL, políticas RLS e RPC para convite. A migração já foi aplicada ao projeto Supabase ativo e não deve ser repetida sem conferir os objetos existentes.
