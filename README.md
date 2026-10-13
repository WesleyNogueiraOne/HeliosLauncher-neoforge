<p align="center"><img src="./app/assets/images/logo.png" width="140" alt="Root Client"></p>

<h1 align="center">Root Client</h1>

<p align="center">Launcher oficial do <b>Root RP</b> — Minecraft NeoForge 1.21.1 com mods, configs e KubeJS sincronizados automaticamente.</p>

## O que faz

- Instala e valida Java, NeoForge, mods, configs e scripts KubeJS sozinho.
- Atualiza o modpack a cada abertura (lê o `distribution.json` do repositório `distro`).
- Remove dos jogadores arquivos de config/kubejs que saíram do pack.
- Login Microsoft ou offline, múltiplas contas.
- Novidades, Jornal e Tickets integrados ao site do Root RP.
- Atualização automática do próprio launcher via GitHub Releases.

## Desenvolvimento

Requer Node.js 20.

```bash
npm install
npm start
```

## Build

```bash
npm run dist:win
```

Release: crie uma tag `vX.Y.Z` (igual ao `version` do `package.json`) e dê push.
O workflow `.github/workflows/build.yml` builda Windows/macOS/Linux e cria um
release em rascunho no GitHub. Publique o rascunho para liberar o auto-update.

## Onde mexer

| O quê | Arquivo |
|---|---|
| Nome, textos de boas-vindas, links sociais | `app/assets/lang/_custom.toml` |
| Textos da interface | `app/assets/lang/en_US.toml` |
| URL do distro | `app/assets/js/distromanager.js` |
| Tema / visual | `app/assets/css/theme.css`, `app/assets/css/layout.css` |
| Login Microsoft (Azure Client ID) | `app/assets/js/ipcconstants.js` — ver `docs/microsoft-auth.md` |
| Integração com o site (tickets) | `app/assets/js/rootapi.js` |

Mods, configs, KubeJS e notícias são gerenciados pelo **Root Distro Manager**
(`../distro-manager`), não por este repositório.

## Licença

Root Client © Root RP. Baseado em código MIT — veja `LICENSE.txt`.
