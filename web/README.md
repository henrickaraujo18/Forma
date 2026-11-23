# Forma Fitness · Web PWA
Sistema de acompanhamento de treinos para **Henrick** e **Cecília**, com rotinas digitalizadas a partir das prescrições de 30/03/2026.
Esta pasta **não modifica** o aplicativo nativo em Swift na raiz do repositório.

## Recursos já operacionais
- Duas contas/perfis locais separados.
- Prescrições detalhadas de 5 divisões PPL+Upper/Lower e 4 divisões Upper/Lower.
- Registrar séries por tipo (aquecimento, feeder, trabalho, top), carga, reps, RPE, notas e conclusão.
- Pré-preencher cargas a partir da última sessão da mesma rotina.
- Temporizador de descanso configurável, continuação da sessão após fechar/atualizar o navegador.
- Dashboard de sessões, frequência, tonagem e peso.
- Gráficos de volume, carga por exercício, 1RM estimado e medidas corporais.
- Peso, altura, IMC, % gordura, massa magra estimada, relação cintura/altura, medidas, sono e FC repouso.
- Registro de cardio (modalidade, tempo, distância, FC, esforço).
- Rotinas personalizáveis, edição de séries, exercícios e descanso, calendário.
- Histórico, recordes, CSV e backup JSON restaurável.
- PWA instalável e cache offline em HTTPS.

## Privacidade e limitações
**Esta primeira versão é local-first.** Os dados são gravados no localStorage do navegador utilizado.
Não há servidor, login, sincronização automática entre aparelhos, integração Apple Health ou backup na nuvem.
Um mesmo dispositivo pode alternar perfis com históricos separados, mas **não deve ser considerado uma solução multiusuário segura**.
Se apagar os dados do navegador, os dados podem ser perdidos. Gere backups JSON em Configurações.
A aplicação não interpreta IMC ou gordura como diagnóstico e não prescreve aumento automático de carga.
Para uso no iPhone, abrir em Safari e usar **Compartilhar → Adicionar à Tela de Início**.

## Execução
Como não há dependências, basta servir a pasta `web` em HTTP/HTTPS.
```bash
cd web
python3 -m http.server 8000
```
Depois acesse http://localhost:8000 .
Para validar:
```bash
cd web
npm run check
npm test
```

## Próxima etapa arquitetural
Para sincronização real e login seguro entre iPhone e outros aparelhos, conectar Supabase Auth e PostgreSQL com políticas RLS por usuário/casal e armazenamento criptografado em trânsito. Não reutilizar o banco de dados de outros projetos financeiros.
