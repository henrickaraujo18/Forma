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


## Instalação pessoal no iPhone (Windows)
1. Aguarde o artefato `Forma-unsigned-ipa` ficar disponível em Actions após uma compilação concluída com sucesso.
2. Baixe o ZIP do artefato e extraia `Forma-unsigned.ipa`.
3. No Windows, use o Sideloadly oficial para assinar e instalar o IPA no iPhone conectado por USB, com o iPhone desbloqueado e a opção de confiar neste computador aceita.
4. Entre somente no Sideloadly com seu próprio Apple ID; não compartilhe senha ou código de verificação com terceiros. Com conta gratuita, a assinatura normalmente precisa ser renovada periodicamente.

O IPA sem assinatura não pode ser instalado diretamente; a assinatura local é uma etapa obrigatória. Este protótipo ainda não integra HealthKit nem a balança OKOK.
