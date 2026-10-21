# Forma iOS — aplicativo nativo em desenvolvimento

Aplicativo pessoal para iPhone feito em SwiftUI. Este repositório contém o projeto Xcode e uma compilação automática em macOS via GitHub Actions.

## Funcionalidades do protótipo
- Treinos A, B, C, Upper e Lower, com exercícios, séries, repetições e carga editáveis.
- Registro e histórico de peso e cintura.
- Cadastro de medicamentos e marcação de dose tomada.
- Persistência local no aparelho.

## Limitações atuais
- Ainda não há integração implementada com Apple Health/HealthKit nem leitura da balança OKOK via Bluetooth.
- O workflow gera um IPA sem assinatura. Isso confirma a etapa de build, mas o arquivo não instala diretamente em um iPhone sem assinatura válida.
- O projeto deve ser validado pelo resultado do GitHub Actions antes de considerar a compilação bem-sucedida.

## Compilação
O workflow `Build Forma iOS` roda automaticamente ao enviar alterações para `main` e também pode ser iniciado manualmente em Actions.
