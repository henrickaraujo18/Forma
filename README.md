# Forma Fitness · Web/PWA

**O Forma é um aplicativo pessoal de treinamento e evolução corporal, 100% web.**
O projeto iOS anterior foi descontinuado e removido da árvore de trabalho.
O aplicativo atual é instalado pelo navegador e não depende de Apple Saúde ou balança Bluetooth.

## Abrir o aplicativo

**https://forma-fitness-khaki.vercel.app/**

## Recursos

- Treinos de Henrick (5 rotinas) e Cecília (4 rotinas), conforme fichas fornecidas.
- Registro de séries, cargas, repetições, RPE e cronômetro de descanso.
- Sessões simultâneas e independentes por atleta.
- Peso corporal, medidas, IMC, indicadores e gráficos de evolução.
- Cardio, calendário, planejamento, histórico, exportação CSV e backup JSON.
- Conta individual, sincronização via Supabase, convite familiar.
- Transições cinematográficas de telas, cards e gráficos SVG animados.
- Demonstração em cada um dos **44 exercícios distintos** do plano original: **12 vídeos MP4** (5,5–8 s) e **32 animações com quadros inicial/final** (ciclo de 8 s).
- Os exemplos de vídeos com pequenas diferenças de equipamento ou posição estão assinalados como **variações** e não devem substituir a prescrição da ficha.
- Funciona como PWA, com suporte de recursos offline e preferência de movimento reduzido.

## Desenvolvimento

Código da aplicação em [`web/`](web/).
Para iniciar localmente:

```bash
cd web
python3 -m http.server 8000
```

Teste automatizado no GitHub Actions: [Forma Web checks](https://github.com/henrickaraujo18/Forma/actions/workflows/forma-web.yml).

## Mídias e licenciamento

- Biblioteca de clipes MP4: [Workout Free Videos](https://github.com/namnq/workout-free-videos), licença CC0 1.0.
- Biblioteca de demonstrações animadas: [Open Exercise Illustrations](https://github.com/MarvinNazari/exercise-images), licença CC0 1.0.

Os vídeos são carregados sob demanda do CDN; animações usam as duas poses da ilustração. Cada demonstração tem botão para ampliar. O usuário também pode cadastrar uma URL de MP4/WebM própria no editor do exercício.

**Escopo atual:** exclusivamente a versão Web/PWA. Sem Apple Health, sem OKOK e sem código nativo iOS. Os dados reais não são alterados por atualizações visuais.
