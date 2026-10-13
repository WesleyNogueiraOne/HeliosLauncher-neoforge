# Login Microsoft — Azure Client ID próprio

O launcher ainda usa um Client ID herdado em `app/assets/js/ipcconstants.js`.
Enquanto não trocar, a tela de login da Microsoft mostra o nome do app antigo.

Para usar o ID do Root Client:

1. Acesse https://portal.azure.com → **Microsoft Entra ID** → **App registrations** → **New registration**.
   - Nome: `Root Client`
   - Supported account types: *Personal Microsoft accounts only*
   - Redirect URI: plataforma **Mobile and desktop**, valor
     `https://login.microsoftonline.com/common/oauth2/nativeclient`
2. Copie o **Application (client) ID**.
3. Peça acesso à Minecraft API pro app no formulário de revisão de App ID da
   Mojang (https://aka.ms/mce-reviewappid). Sem aprovação o login Microsoft
   falha na etapa do Minecraft (erro 403).
4. Depois de aprovado, troque o valor de `AZURE_CLIENT_ID` em
   `app/assets/js/ipcconstants.js` (ou defina `ROOT_AZURE_CLIENT_ID` no build).

Login offline não depende disso.
