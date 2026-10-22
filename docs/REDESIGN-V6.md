# Root Client — Redesign v6 "Gazeta & Ficha"

> Especificação de UI/UX para tirar o Root Client da estrutura do Helios e alinhá-lo ao site oficial (rootrp-site.vercel.app).
> Janela-alvo: 1280×720 (mínimo 1000×~600, `index.js:222`). Todos os wireframes usam essa proporção.

---

## 0. Diagnóstico (antes de desenhar)

O que foi encontrado no código e no site, e que orienta todas as decisões abaixo:

| Ponto | Launcher hoje | Site oficial | Consequência |
|---|---|---|---|
| Fonte de título | Cinzel / Cinzel Decorative | **Fraunces** | O launcher parece "outro produto". Trocar. |
| Fonte de UI | Inter | **Space Grotesk** | Trocar. |
| Ouro | `#e7b23e` (amarelo saturado) | `#c98a3f` / `#e3b46e` / `#9c6a2c` (âmbar queimado) | Hoje o ouro está "gritando". Ajustar. |
| Fundo | `#0b0c10` (preto neutro) | `#10141c` (azul-ardósia) | Trocar. |
| Acento arcano | teal `#5ad2bd` | roxo `#8b7bd6` **+** teal `#5fb0a8` (foco) **+** folha `#6fbf73` | O launcher não tem roxo nem verde. Adicionar. |
| Assinatura dos cards | glass + borda simples | **moldura dupla** (borda + filete interno a 7px) | É a marca mais reconhecível do site. Levar pro launcher. |
| Eyebrow | ponto pulsante | **losango 45°** dourado + texto teal em caixa alta | Trocar. |
| Botões | gradiente próprio | `.btn-gold` (gradiente vertical + brilho que varre no hover) e `.btn-ghost` | Copiar exatamente. |
| Layout | marca no topo esquerdo, conta no topo direito, herói, coluna de notícias à direita, dock embaixo com JOGAR à direita | — | É o esqueleto do Helios com outra pele. **É isso que muda.** |
| DOM legado | `#newsContainer`, `#lower`, `#newsButton`, Mojang Status, anel de loading | — | São rastros do Helios, ainda presentes e escondidos. |

---

## 1. Conceito de layout

**A ideia central: o botão Jogar sai do dock e passa a ser o rodapé da ficha do personagem.**

Quase todo launcher (inclusive o Helios) trata "Jogar" como um botão solto num canto. Aqui ele fecha a ficha do jogador: *você é este personagem → entre em Selenia como ele*. A tela fica dividida em três módulos fixos:

1. **Ficha** (coluna esquerda): quem eu sou, e o botão Jogar.
2. **Gazeta de Selenia** (centro): o que está acontecendo no mundo.
3. **Torre de Vigia** (coluna direita estreita): estado do servidor, eventos e atalhos.

Elementos de HUD do Minecraft aparecem só onde reforçam uma função, e de forma discreta:

- **Barra de XP** como progresso de download/launch: segmentada, fina e na borda inferior da janela inteira.
- **Hotbar** de atalhos com números `1`–`5`, que funcionam de verdade como teclas.
- **Toast de conquista** para notificações ("Modpack atualizado", "Novo decreto publicado").
- **Tooltip** com a moldura do tooltip do Minecraft, recolorida com a paleta do site.

---

## 2. Wireframes

### 2.1 Tela principal: "Mesa do Cronista"

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◆ ROOT CLIENT   Gazeta   Crônicas   Eventos   Tickets(2)            ⟳ v1.0.8 disponível  ─ □ ✕ │ ← barra HUD 40px (arrastável)
├───────────────────────┬──────────────────────────────────────────────────┬───────────────────┤
│ ╔═══════════════════╗ │  A GAZETA DE SELENIA                             │ ┌ TORRE DE VIGIA ┐│
│ ║                   ║ │  Edição nº 42 · Quinta, 22 de Outubro            │ │ ● ONLINE       ││
│ ║   [ skin 3D       ║ │  ════════════════════════════════════════════    │ │ 87 / 200       ││
│ ║    girável ]      ║ │  ┌──────────────────────────────┐ ┌────────────┐ │ │ ▁▂▃▅▆▇▆▅ 24h   ││
│ ║                   ║ │  │ [ imagem de capa ]           │ │ DECRETO    │ │ │ ping  42 ms    ││
│ ║                   ║ │  │                              │ │ Wargheim   │ │ │ play.rootrp…⧉  ││
│ ╚═══════════════════╝ │  ├──────────────────────────────┤ │ fecha a    │ │ └────────────────┘│
│  Kaoro Fujitsu        │  │ TIMENOR · BOLETIM TÉCNICO    │ │ passagem   │ │                   │
│  ⚑ Shin Kairen        │  │ Guildas de vapor ganham      │ │ norte…     │ │ ◆ PRÓXIMOS        │
│  Ferreiro · Cidadão   │  │ nova linha de produção       │ ├────────────┤ │ ┌───────────────┐ │
│  ───────────────────  │  │ Lorem ipsum resumo em duas   │ │ EVENTO     │ │ │ SÁB 20:00     │ │
│  ⏱ 142h  ⚔ 12  ◈ Raiz │  │ linhas com capitular…        │ │ Feira de   │ │ │ Feira de      │ │
│  ───────────────────  │  │                  ler mais →  │ │ Miralac    │ │ │ Miralac       │ │
│  Neoforge 1.21.1      │  └──────────────────────────────┘ └────────────┘ │ │ em 2d 04h ⏰  │ │
│  Modpack ✓ sincronizado│  ── Também nesta edição ──────────────────────  │ └───────────────┘ │
│ ┌───────────────────┐ │  • Patch 0.9.3: correções de colisão     ontem   │ ┌───────────────┐ │
│ │  ▶  ENTRAR EM     │ │  • Recrutamento: Guarda de Cinndor     3 dias   │ │ ...           │ │
│ │     SELENIA       │ │  • Crônica: A queda do Rei Rato        5 dias   │ └───────────────┘ │
│ └───────────────────┘ │                                                  │                   │
│  trocar conta ▾   ⚙   │                                                  │ [1][2][3][4][5]   │ ← hotbar
│                       │                                                  │ Loja Regras Disc… │
├───────────────────────┴──────────────────────────────────────────────────┴───────────────────┤
│▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱  Baixando mods · 128/342 · 18,4 MB/s · 62%                       │ ← barra XP (só durante o launch)
└──────────────────────────────────────────────────────────────────────────────────────────────┘
   280px                              flex (~680px)                                  260px
```

**Grid:** `grid-template-columns: 280px 1fr 260px; grid-template-rows: 40px 1fr auto;`, com gutter de 16px e padding externo de 16px.

**Hierarquia de leitura (padrão F):**
1. Skin e nome do personagem: o primeiro elemento no canto superior esquerdo.
2. **ENTRAR EM SELENIA**: o único botão dourado da tela, alinhado ao rodapé da coluna.
3. Manchete da Gazeta: o maior texto da tela (Fraunces 28px).
4. Status do servidor: sinal verde/teal no topo direito.
5. O resto (atalhos, edições anteriores, versão).

**Estados do botão Jogar** (o botão nunca troca de lugar, só muda o conteúdo):

| Estado | Visual |
|---|---|
| Pronto | `.btn-gold`, ícone ▶ e o texto "ENTRAR EM SELENIA" |
| Sem conta | `.btn-ghost`: "CRIAR PASSAPORTE" (abre o Login) |
| Atualizando | desabilitado, texto "PREPARANDO…", e a barra XP aparece embaixo |
| Jogo aberto | `.btn-ghost` com borda folha: "EM JOGO · 00:42:13" |
| Servidor offline / em breve | `.btn-ghost`: "SERVIDOR EM BREVE", com contagem regressiva se houver data |

**Comportamento das abas da barra HUD:**
- **Gazeta** (padrão): notícias oficiais (o atual `loadRootNews`).
- **Crônicas**: o atual "Jornal" (`loadJournal`): lore e conteúdo de jogadores.
- **Eventos**: lista completa com calendário.
- **Tickets**: o atual `rcTicketsList`, com badge numérico.

As abas trocam **só o módulo central**. A Ficha e a Torre ficam fixas.

**Abaixo de 1100px de largura:** a Torre de Vigia recolhe para uma faixa de 56px só com ícones (status ●, eventos ⏰, hotbar vertical) e se expande num drawer ao clicar.

---

### 2.2 Login: "Passaporte de Selenia"

O Login substitui o `loginOptions.ejs` atual, que hoje é logo + título + dois botões centralizados, idêntico ao Helios.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◆ ROOT CLIENT                                                                         ─ □ ✕ │
├────────────────────────────────────────────────┬─────────────────────────────────────────────┤
│                                                │                                             │
│   [ arte do reino em tela cheia, troca a cada  │   ◆ PASSAPORTE DE SELENIA                   │
│     8s em crossfade: Wargheim, Sahiin… ]       │                                             │
│                                                │   Antes de cruzar a fronteira,              │
│                                                │   diga quem você é.                         │  ← Fraunces 30px
│                                                │                                             │
│                                                │   ╔═══════════════════════════════════════╗ │
│                                                │   ║ ▣  Entrar com Microsoft               ║ │  ← btn-gold (recomendado)
│                                                │   ║    Conta original · skin oficial      ║ │
│                                                │   ╚═══════════════════════════════════════╝ │
│   WARGHEIM                                     │   ┌───────────────────────────────────────┐ │
│   A Fortaleza dos Lobos                        │   │ ◯  Entrar sem conta original          │ │  ← btn-ghost
│   "Warg: lobo · Heim: fortaleza"               │   │    Apelido de 3 a 16 caracteres       │ │
│                                                │   └───────────────────────────────────────┘ │
│   ● ○ ○ ○ ○ ○ ○   (7 reinos)                   │                                             │
│                                                │   ── ou ──────────────────────────────────  │
│                                                │   Novo por aqui?  Como jogar ↗  Discord ↗   │
│                                                │                                             │
│                                                │   16+ · Sem pay-to-win · Termos ↗           │
└────────────────────────────────────────────────┴─────────────────────────────────────────────┘
                        ~55%                                          ~45%
```

**Fluxo offline:** o painel direito faz um slide horizontal (não abre um modal) e mostra:

```
   ← voltar
   ◆ PASSAPORTE PROVISÓRIO
   Como devemos te chamar?
   ┌───────────────────────────────────────┐
   │ Kaoro_                                │   ← validação ao vivo: ✓ teal / ✕ vermelho
   └───────────────────────────────────────┘
   3 a 16 caracteres: letras, números e _
   [ CARIMBAR PASSAPORTE ]  ← btn-gold
```

**Microinteração:** depois de autenticar, aparece um "carimbo" com o brasão (rotate −8°, scale 1.4 → 1, 300ms) por cima do painel. Depois disso, a transição vai para a tela principal.

---

### 2.3 Perfil: "Ficha do Personagem" (tela nova)

Abre ao clicar no nome ou na skin na coluna Ficha. É um painel que cobre o módulo central e a Torre; a coluna da Ficha continua visível.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◆ ROOT CLIENT   Gazeta   Crônicas   Eventos   Tickets                                 ─ □ ✕ │
├───────────────────────┬──────────────────────────────────────────────────────────────────────┤
│  (Ficha compacta)     │  ← Voltar                                    ◆ FICHA DO PERSONAGEM  │
│                       │ ┌──────────────────────┐  KAORO FUJITSU                              │
│                       │ │                      │  ⚑ Shin Kairen · A Vila da Lâmina Oculta    │
│                       │ │   [ skin 3D grande,  │  Ferreiro · Cidadão · Guilda do Martelo     │
│                       │ │     pose animada,    │                                             │
│                       │ │     arrastar p/ girar│  ┌────────┐┌────────┐┌────────┐┌────────┐   │
│                       │ │   ]                  │  │ 142h   ││ Nv 23  ││ 12     ││ ◈ Raiz │   │
│                       │ │                      │  │ jogadas││ ofício ││ missões││ apoio  │   │
│                       │ └──────────────────────┘  └────────┘└────────┘└────────┘└────────┘   │
│                       │  [ Trocar skin ↗ ] [ Capa ▾ ]                                       │
│                       │ ──────────────────────────────────────────────────────────────────── │
│                       │  ◆ CONQUISTAS RECENTES          ◆ CONTAS VINCULADAS                 │
│                       │  ▣ Primeiro Ferro   há 2 dias   ● Kaoro_ (Microsoft)   ativa        │
│                       │  ▣ Viajante         há 5 dias   ○ kaoro_alt (offline)  [usar]      │
│                       │  ▣ Mercador         há 1 sem    [+ adicionar conta]                │
│                       │                                                                      │
│                       │  ◆ ÁRVORE DE APOIO                                                   │
│                       │  Semente ─ Broto ─ Muda ─ ●Raiz ─ Raiz Prof. ─ … ─ Árvore-Mãe       │
│                       │  Obrigado por sustentar Selenia.   [ Apoiar ↗ ]                     │
└───────────────────────┴──────────────────────────────────────────────────────────────────────┘
```

- A **Árvore de Apoio** reaproveita os 14 tiers do site (Semente → Árvore-Mãe). É identidade de marca que nenhum outro launcher tem.
- As **contas vinculadas** substituem o overlay `#accountSelectContent` do Helios: a troca de conta acontece aqui, não num modal.
- **Dados:** reino, cargo, horas, nível e tier dependem de um endpoint no site (ex.: `GET /api/player/:uuid`). Sem ele, a ficha mostra só nome, skin e contas, e os campos de RP aparecem como "Ainda não registrado em Selenia" (texto muted e itálico, sem um card vazio quebrado).

---

### 2.4 Configurações: "Oficina"

Hoje é a navegação lateral do Helios com um botão "Concluído" embaixo. Muda para **abas no topo + conteúdo em cards**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◆ ROOT CLIENT   ← Voltar à Mesa                                                       ─ □ ✕ │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ◆ OFICINA                                                                                   │
│  Ajuste o motor antes da viagem.                                                             │
│                                                                                              │
│  [ Desempenho ]  Jogo   Mods   Java   Launcher   Sobre   Atualizações                        │  ← tabs pill; ativa = sublinhado ouro 2px
│  ───────────────────────────────────────────────────────────────────────────────────────    │
│ ╔══════════════════════════════════════════╗ ╔══════════════════════════════════════════╗   │
│ ║ ◆ MEMÓRIA                                 ║ ║ ◆ RECOMENDAÇÃO                           ║   │
│ ║                                           ║ ║                                          ║   │
│ ║  ┌─────────────────────────────────┐      ║ ║  Seu PC: 16 GB                           ║   │
│ ║  │▰▰▰▰▰▰▰▰▰▰▰▰▰░░░░░░░░░░░░░░░░░░│ 6 GB ║ ║  Ideal para o modpack: 6–8 GB            ║   │
│ ║  └─────────────────────────────────┘      ║ ║  [ Aplicar recomendado ]                 ║   │
│ ║   2        ▲ recomendado        16        ║ ║                                          ║   │
│ ║  Livre: 9,2 GB · Total: 16 GB             ║ ║                                          ║   │
│ ╚══════════════════════════════════════════╝ ╚══════════════════════════════════════════╝   │
│ ╔═════════════════════════════════════════════════════════════════════════════════════════╗ │
│ ║ ◆ RESOLUÇÃO          [ 1920 ] × [ 1080 ]    Tela cheia  ◯━━  ·  Fechar launcher  ━━●    ║ │
│ ╚═════════════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                    ✓ Salvo automaticamente   │  ← sem botão "Concluído"
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **A aba "Conta" sai das Configurações** e vai para a Ficha (2.3).
- O slider de memória ganha uma **faixa recomendada** marcada (zona teal) e um marcador ▲.
- A aba **Mods** vira uma lista de linhas com chip de status (`Obrigatório` em ouro, `Opcional` em ghost, `Desatualizado` em vermelho) e um toggle. Nada de grade de inventário: lista é mais legível.
- O salvamento passa a ser automático, com o feedback "✓ Salvo" no rodapé (fade de 2s). Isso elimina o `#settingsNavDone`.

---

### 2.5 Telas de apoio

| Tela | Hoje (Helios) | Novo |
|---|---|---|
| **Loading** (`#loadingContainer`) | logo + `loading-ring.png` girando | Logo estático, com um **broto que cresce** (SVG animando `stroke-dashoffset`: semente → raiz → folha), sobre o fundo `--bg`. Conversa com o motivo de "raiz" do site. |
| **Welcome** (`welcome.ejs`) | tela de boas-vindas genérica | Onboarding em 3 passos com "páginas de crônica": 1) O que é Selenia, 2) Escolha como entrar, 3) Ajuste de memória automático. |
| **Overlay de erro** (`#overlayContent`) | caixa centralizada do Helios | Modal com a moldura dupla, um ícone de estado no topo e botões `.btn-gold`/`.btn-ghost` alinhados à direita. |
| **Seleção de servidor** (`#serverSelectContent`) | lista do Helios | Se existir só um servidor, **remover da UI**. Se houver mais (ex.: Beta / Principal), usar um dropdown simples ancorado no card de status da Torre. |

---

## 3. Widgets de RP: especificação

### 3.1 Torre de Vigia (status do servidor)

```
┌ ◆ TORRE DE VIGIA ───────────┐     ← cantoneiras (corner brackets) de 8px em ouro 40%
│  ● ONLINE                    │     ← dot folha #6fbf73 pulsando 2s; offline = #ff6568 parado
│  87 / 200 jogadores          │     ← número em Space Grotesk 600 tabular-nums
│  ▁▂▃▅▆▇▆▅▃▂  últimas 24h     │     ← sparkline SVG teal, 120×24
│  ping 42 ms   ▮▮▮▯           │     ← barras: <80 folha, <150 ouro, ≥150 vermelho
│  play.rootrp.com.br    ⧉     │     ← mono 12px; ⧉ copia → toast "IP copiado"
└──────────────────────────────┘
```

- **Fonte dos dados:** o Helios já faz o ping de status do servidor (contagem de jogadores em `#player_count`). Medir a latência com `performance.now()` antes e depois desse ping. O histórico de 24h precisa de um endpoint no site, ou do armazenamento local das últimas leituras (uma a cada 5 min).
- **Estado "em breve"** (hoje o site não publica IP): mostrar `◆ EM BREVE · Beta fechado`, com contagem regressiva se houver data, e o CTA ghost "Avise-me no Discord".

### 3.2 Gazeta de Selenia (feed)

- **Masthead:** "A GAZETA DE SELENIA" em Fraunces 600, caixa alta, tracking .12em, entre filetes duplos de 1px (`border-top`/`border-bottom` com `double 3px`). Linha de edição: `Edição nº {n} · {data por extenso}`.
- **Manchete** (o primeiro item do feed): imagem 16:9, chapéu com editoria e reino (`TIMENOR · BOLETIM TÉCNICO`), título Fraunces 26–28px, resumo de 2 linhas com **capitular** (`::first-letter` em Fraunces, 2,6em, ouro).
- **Coluna lateral:** 2 notas curtas, sem imagem, com **carimbo de categoria**.
- **"Também nesta edição":** lista densa de título + data relativa.
- **Carimbos de categoria:** cada um tem cor própria, sempre em pílula pequena (10px, caixa alta, tracking .14em, borda 1px):

| Categoria | Cor |
|---|---|
| DECRETO | ouro |
| EVENTO | arcano `#8b7bd6` |
| BOLETIM TÉCNICO (patch) | teal |
| CRÔNICA (lore) | `--text` em itálico |
| RECRUTAMENTO | folha |

- **Vídeo** (YouTube, já suportado em `renderFeedEntry`): a thumb ganha um botão ▶ circular em ouro e o selo "ASSISTIR".

### 3.3 Próximos eventos

- O card mostra o dia e a hora em caixa alta, o título em Fraunces 15px e uma contagem regressiva ao vivo.
- Com menos de 1h para o início, a borda fica arcano e aparece um botão "Lembrar" que dispara uma notificação nativa do Electron.
- A aba "Eventos" mostra uma tira de 7 dias com os eventos posicionados.

### 3.4 Hotbar de atalhos

```
[1 🛒] [2 📜] [3 ◉] [4 📖] [5 🎫]
 Loja  Regras Discord Wiki Ticket
```

- Slots de 40×40, radius 6px, fundo `--panel-2` e borda `--border`. No hover/foco, a borda vira ouro e o número no canto superior esquerdo fica em 9px. A label aparece embaixo, em 10px muted.
- As teclas `1`–`5` abrem cada atalho quando o foco não está num input.
- Itens "em breve" do site (Loja, Wiki) ficam com opacity .45, cadeado pequeno e tooltip "Em breve".
- Os links atuais de redes (`#rcSocial`: Discord, YouTube, Instagram, TikTok) **saem do rail lateral**. O Discord entra na hotbar; os outros vão para o rodapé da aba "Sobre" e para um menu `⋯`.

### 3.5 Toast de conquista

- Aparece no canto inferior direito, acima da barra XP: 300×64, com ícone 32px à esquerda, título em ouro 12px caixa alta ("Conquista desbloqueada" / "Modpack atualizado") e texto 13px.
- Entra com slide da direita (220ms, `cubic-bezier(.16,1,.3,1)`) e sai depois de 4s.
- Substitui os avisos soltos de atualização (`#updateAvailableTooltip`).

---

## 4. Guia de estilo da interface

### 4.1 Tokens de cor (espelham o site)

```css
:root {
  /* Superfícies */
  --bg:            #10141c;
  --bg-2:          #141a24;
  --panel:         #171e2a;
  --panel-2:       #1c2633;
  --glass:         rgba(23, 30, 42, .55);   /* #171e2a8c */
  --border:        #273244;
  --border-strong: #3c4c66;

  /* Texto */
  --text:          #ece7de;   /* pergaminho, nunca #fff puro */
  --muted:         #9aa6b6;
  --muted-2:       #69748a;

  /* Marca */
  --gold:          #c98a3f;
  --gold-soft:     #e3b46e;
  --gold-deep:     #9c6a2c;
  --on-gold:       #21160a;   /* texto sobre botão dourado */

  /* Semânticas */
  --teal:          #5fb0a8;   /* interação secundária, foco, links */
  --teal-soft:     #8fd0c8;
  --arcane:        #8b7bd6;   /* lore, eventos, magia */
  --arcane-soft:   #a99ee2;
  --leaf:          #6fbf73;   /* online, sucesso, apoio */
  --danger:        #ff6568;

  /* Efeitos */
  --glow-gold:  0 0 0 1px #c98a3f24, 0 14px 40px -16px #c98a3f73;
  --shadow-lg:  0 24px 60px -24px #000000b3;
  --ease-out:   cubic-bezier(.16, 1, .3, 1);
}
```

**Regras de uso (o que evita o aspecto poluído):**

| Cor | Onde pode | Onde **não** pode |
|---|---|---|
| Ouro | **um** botão primário por tela, capitular, masthead, item ativo | ícones genéricos, bordas de todo card, textos longos |
| Teal | foco (`:focus-visible`), links, hover de ghost, sparkline | botões primários |
| Arcano | eventos, crônicas/lore, carimbo EVENTO | status do servidor |
| Folha | online, sucesso, tier de apoio | decoração |
| Vermelho | erro, offline, badge de tickets | decoração |

**Proporção-alvo:** ~80% superfícies neutras, ~12% texto, ≤ 8% cores de acento.

O fundo da janela é o mesmo `body` do site: radial roxo no topo direito, âmbar no topo esquerdo e teal embaixo, sobre `--bg`. A imagem do reino (`backgrounds/*.jpg`) fica **atrás**, com overlay `linear-gradient(--bg 0%→70%)`, para não brigar com o conteúdo.

### 4.2 Tipografia

| Papel | Fonte | Tamanho / peso | Uso |
|---|---|---|---|
| Display | Fraunces | 40–56 / 600 | título do Login, nome na Ficha |
| H1 | Fraunces | 26–28 / 600 | manchete da Gazeta |
| H2 | Fraunces | 18–20 / 600 | títulos de card |
| Eyebrow | Space Grotesk | 11 / 600, caixa alta, tracking .26em, teal | rótulo acima de seção |
| Corpo | Space Grotesk | 13–14 / 400, line-height 1.6 | textos |
| UI | Space Grotesk | 12–13 / 500 | botões, abas, labels |
| Dados | Space Grotesk `tabular-nums` / mono | 12–15 / 600 | ping, slots, IP, versões |
| Lore | Fraunces itálico | 14 / 400 | citações ("— Crônicas de Selenia") |

As fontes são embutidas em woff2 (SIL OFL), como já acontece hoje em `fonts.css`, e continuam funcionando offline. **Saem** Cinzel, Cinzel Decorative, Crimson Pro e Inter.

### 4.3 Componentes

**Botão primário (`.rc-btn-gold`):** é cópia do `.btn-gold` do site.
- Fundo `linear-gradient(180deg, var(--gold-soft), var(--gold) 62%, var(--gold-deep))`, texto `--on-gold` 700 e `box-shadow: var(--glow-gold)`.
- Hover: `translateY(-1.5px)` + brilho diagonal que varre da esquerda para a direita (`::before` com skew −18°, 600ms).
- Active: `scale(.985)`.
- Radius: `999px` para botões comuns; `14px` para o botão grande "Entrar em Selenia" (altura 56px).

**Botão secundário (`.rc-btn-ghost`):**
- Borda `1px var(--border-strong)`, fundo `#ffffff04`.
- Hover: borda teal + fundo `#5fcdbd17` + brilho teal.

**Botão de ícone:** 36×36, radius 10px, ghost. O hover só muda a cor do ícone para `--text`.

**Card (`.rc-card`): a assinatura do site.**
```css
.rc-card {
  position: relative;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: linear-gradient(#172220eb, #10191be6);
  box-shadow: inset 0 1px #ffffff08, 0 18px 48px -30px #0009;
}
.rc-card::after {                 /* moldura interna */
  content: ""; position: absolute; inset: 7px;
  border: 1px solid #c98a3f1c; border-radius: 12px; pointer-events: none;
  transition: border-color .25s;
}
.rc-card:hover::after { border-color: #c98a3f33; }
.rc-card--glow::before {          /* filete dourado no topo */
  content: ""; position: absolute; inset: 0 0 auto; height: 1px;
  background: linear-gradient(90deg, transparent, #eab94d80, transparent);
}
```
Use a moldura dupla só nos módulos principais (Ficha, manchete, Torre, cards das Configurações). Itens de lista usam borda simples ou só um divisor. **Moldura dupla dentro de moldura dupla é proibido.**

**Eyebrow (`.rc-eyebrow`):** losango 9×9 girado 45° (borda ouro, fundo ouro 28%), gap de 9px, texto teal 11px caixa alta com tracking .26em.

**Cantoneiras de HUD (`.rc-hud`):** quatro `background` lineares de 8×1px e 1×8px nos cantos, em ouro 40%. É o único elemento "HUD" fixo, usado só na Torre de Vigia e no viewer de skin.

**Chips/carimbos:** altura 20px, padding 0 8px, radius 999px, 10px caixa alta, borda 1px na cor da categoria e fundo na mesma cor a 10%.

**Inputs:**
- Altura 44px, radius 12px, fundo `--bg-2`, borda `--border`.
- Foco: borda teal + `box-shadow: 0 0 0 3px #5fb0a826`.
- Erro: borda `--danger` + mensagem 12px embaixo.

**Toggle:** trilho 36×20 em `--panel-2`. Ligado: trilho folha a 30% e bolinha folha. Transição de 180ms.

**Slider:** trilho 6px; parte preenchida em gradiente ouro; zona recomendada em teal 25%; thumb 16px pergaminho com borda ouro.

**Barra XP (progresso):** 6px de altura, com segmentos de 8px separados por 2px (`repeating-linear-gradient`). O preenchimento vai de folha para teal (é o "verde XP" sem copiar o verde-limão do Minecraft). O texto fica à direita, em 11px tabular.

**Tooltip:** fundo `#100a1af2`, borda 1px `--arcane` a 50% com contorno interno de 1px `#000`, radius 4px e texto 12px. É a referência direta ao tooltip do Minecraft.

**Scrollbar:** 6px, thumb `--border-strong`, que fica `--muted-2` no hover. Track transparente.

### 4.4 Espaçamento, raios e bordas

- **Escala de espaço:** 4 · 8 · 12 · 16 · 24 · 32 · 48. Os módulos usam padding de 20px; os cards internos, 16px.
- **Raios:**

| Raio | Uso |
|---|---|
| 999px | botões, chips |
| 16px | módulos |
| 12px | inputs e cards internos |
| 6px | slots da hotbar |
| 4px | tooltip |

  Nada de cantos retos, com uma exceção deliberada: a barra XP.
- **Bordas:** sempre 1px. A hierarquia vem da cor (`--border` < `--border-strong` < ouro), nunca da espessura.
- **Sombras:** só em elementos flutuantes (modais, toasts, hover de card). Os módulos em repouso não têm sombra externa.
- **Movimento:**

| Situação | Duração |
|---|---|
| Hover | 180ms |
| Painéis | 260ms |
| Troca de tela | 320ms, fade + translateY(8px) |

  Tudo com `--ease-out`. Respeite `prefers-reduced-motion`: sem brilho varrendo, sem pulsar, sem crossfade.

### 4.5 Acessibilidade e legibilidade

- Contraste: `--text` sobre `--panel` ≈ 13:1; `--muted` sobre `--panel` ≈ 6,5:1 (passa AA). **`--muted-2` só para metadados ≥ 12px.**
- Texto sobre a arte de fundo: sempre dentro de um módulo ou com overlay. Nunca texto solto sobre a imagem.
- `:focus-visible` em teal em todos os interativos. A navegação por teclado segue a ordem: abas → Ficha → Jogar → Gazeta → Torre.
- Ícones sem texto levam `title` e `aria-label`.

---

## 5. Alterações prioritárias no código (eliminar o Helios)

Em ordem. Cada etapa deixa o launcher funcionando.

### P0: Fundação (sem isso, o resto vira remendo)

1. **Inverter a cascata do CSS.** Hoje `launcher.css` importa `theme.css` e `layout.css` **no topo** e depois declara as ~3.900 linhas do Helios. Assim, a base do Helios vence a sua camada, e é daí que vêm os **314 `!important`**. A nova estrutura:
   ```
   assets/css/
     fonts.css        → Fraunces + Space Grotesk
     tokens.css       → seção 4.1
     base.css         → reset, body, scrollbar, tipografia
     components.css   → btn, card, eyebrow, chip, input, toggle, slider, xpbar, tooltip, toast
     views/frame.css  views/landing.css  views/login.css  views/settings.css  views/profile.css  views/overlay.css
   ```
   No `app.ejs`, os arquivos entram como `<link>` nessa ordem. O `launcher.css` deixa de existir (ou fica vazio, só para não quebrar referências). Os `!important` só voltam com justificativa em comentário.

2. **Trocar os tokens.** O `theme.css` mantém `--purple-*` com valores que não são roxos ("pra não quebrar referências"). Migre para os nomes semânticos da seção 4.1 com um sed (`--purple-abyss`→`--bg`, `--purple-panel`→`--glass`, `--purple-muted`→`--border`, `--purple-text`→`--muted`, `--purple-light`/`--arcane`→`--teal`) e apague os aliases.

3. **Trocar as fontes.** Em `fonts.css`, remova Cinzel, Cinzel Decorative, Crimson Pro e Inter, adicione Fraunces (400/600, mais 400 itálico) e Space Grotesk (400/500/600/700) em woff2, e copie as licenças OFL para `fonts/licenses`. Depois, troque todas as `font-family: 'Cinzel'` por `var(--font-display)`.

### P1: Arrancar o DOM e a estrutura do Helios

4. **`landing.ejs`: apagar o bloco "Elementos legados".** Isso inclui `#newsButton`, `#lower` (com `#left`, `#center` e `#right`) e todo o `#newsContainer` com o `Lorem Ipsum` / `by Cicero`. No `landing.js`, envolva as referências em guards ou remova as funções do feed antigo do Helios (`slide_`, `displayArticle`, `showNewsAlert`, `setNewsLoading`, `reloadNews`). O feed de verdade já é o `loadFeed` / `renderFeedEntry`.

5. **Remover Mojang Status.** Isso vale para `#mojangStatusWrapper`, `#mojangStatusTooltip` e os containers NE no dock, e para as chaves `mojangStatus*` em `lang/en_US.toml`. Remova também as chaves `loginWithMojang`, `addMojangAccount`, `mojangAccount`, `loginPasswordDisclaimer*` e `#settingsCurrentMojangAccounts` (já ficam escondidos com `display:none`). Ninguém usa conta Mojang desde 2023, e isso é a impressão digital mais óbvia do Helios.

6. **Reescrever o grid da landing.** Em `layout.css` (que vira `views/landing.css`), troque `grid-template-areas: "top top" "hero news" "dock dock"` pela estrutura da seção 2.1 (`"hud hud hud" "ficha gazeta torre" "xp xp xp"`). Depois:
   - Mova `#launch_content`, `#launch_button`, `#launch_details` e `#launch_progress` de `#rcDock` para o rodapé da `#rcFicha`. **Mantenha os IDs**, porque o `landing.js` depende deles.
   - Transforme `#launch_progress` na barra XP de largura total (`grid-area: xp`).
   - Apague `#rcHero`: a lore "Selenia" passa para o Login e para a Gazeta, e a tela principal deixa de ser uma landing page de site.
   - Apague `#rcSocial` (rail lateral) e `#rcTopbar` (pílula de conta no topo direito, o lugar padrão do Helios).

7. **Frame bar.** Hoje são 22px, só com o título. Passe para 40px, com marca, abas de navegação e botões de janela, todos com `-webkit-app-region: no-drag` (o resto da barra continua arrastável). Remova as variantes `#frameButtonDockDarwin` e `#frameContentDarwin` se o build for só Windows/Linux.

8. **Tela de loading.** Troque `#loadSpinnerImage` (`loading-ring.png`, girando com `.rotating`) pelo SVG do broto (seção 2.5) e apague `loading-ring.png`.

### P2: Telas secundárias

9. **Login** (`loginOptions.ejs`): monte o layout em duas colunas da seção 2.2. Os IDs `#loginOptionMicrosoft`, `#loginOptionOffline`, `#offlineUsernameInput`, `#offlineLoginConfirm` e `#offlineLoginBack` continuam iguais. Apague do `launcher.css` todos os seletores do login antigo do Helios, já sem DOM correspondente (`#loginContainer`, `#loginContent`, `#loginForm`, `#loginSVG`, `#loginImageSeal`, `#loginDisclaimer`, `#loginRegisterSpan`, `#loginRememberText`, `#loginCancel*`, `#labelPassword`).

10. **Configurações** (`settings.ejs`):
    - Troque `#settingsContainerLeft` (navegação lateral) por uma barra de abas horizontal. Os botões `.settingsNavItem[rSc]` continuam iguais, então o `settings.js` funciona sem mudança.
    - Esconda `#settingsNavDone` e implemente o salvamento automático, chamando o `saveSettingsValues()` que já existe no `change` de cada campo.
    - Mova `#settingsTabAccount` para a tela de Perfil.
    - Reestilize `.toggleSwitch` e o range slider de memória (`#settingsMemoryContent`).

11. **Overlays** (`overlay.ejs`): reestilize `#overlayContent`, `#accountSelectContent` e `#serverSelectContent` com `.rc-card` e os botões novos. A troca de conta migra para a Ficha (2.3). O seletor de servidor só aparece se houver mais de um servidor na distribution.

12. **Welcome** (`welcome.ejs`): substitua pelo onboarding em 3 passos.

### P3: Widgets novos

13. **Ficha + skin 3D:** troque o `background-image` do `mc-heads.net/body` (`landing.js:154`) por **skinview3d** (MIT, roda em canvas/WebGL), carregando a skin por UUID, com rotação por arrasto e animação idle. Se não houver rede, use a skin Steve/Alex local como fallback.
14. **Torre de Vigia:** medir o ping, sparkline local, copiar IP, estado "em breve".
15. **Hotbar** com atalhos de teclado e itens "em breve".
16. **Eventos** com contagem regressiva e notificação nativa.
17. **Toasts** substituindo `#updateAvailableTooltip`.
18. **Perfil:** endpoint `/api/player/:uuid` no site (reino, cargo, horas, tier de apoio), com os estados vazios definidos em 2.3.

### P4: Limpeza final

19. **Apagar seletores mortos.** Rode um script que lista os IDs/classes de `launcher.css` sem ocorrência em `app/*.ejs` + `app/assets/js/**`. Hoje são 197 seletores de ID no arquivo, e boa parte é do Helios sem DOM (`#newsArticle*`, `#newsNavigation*`, `#mojang*`, `#login*`, `#internalMedia`, `#discordSVG`, `#instagramSVG`…).
20. **Remover o `github-dark.css`** importado de `node_modules`. Se for só para a sintaxe do changelog em "Atualizações", estilize os 3–4 seletores necessários em `views/settings.css`.
21. **Consolidar o JS de UI.** `uipolish.js` e `rootclient-ui.js` são camadas de remendo sobre o `uicore`. Absorva a lógica nos scripts de cada view (`landing.js`, `settings.js`).
22. **Revisar o `lang/_custom.toml`** e trocar os textos genéricos do Helios ("Done", "Launch", "Server Status") pelo tom do site: informal, "pra", "a gente" (por exemplo, "Entrar em Selenia", "Voltar à Mesa", "Torre de Vigia").

---

## 6. Checklist "não parece mais Helios"

- [ ] O botão Jogar **não** está no canto inferior direito.
- [ ] Não existe pílula de conta no canto superior direito.
- [ ] Não existe Mojang Status em lugar nenhum (DOM, CSS e lang).
- [ ] Não existe anel girando na tela de loading.
- [ ] As Configurações não têm navegação lateral nem botão "Concluído".
- [ ] Fontes: só Fraunces + Space Grotesk.
- [ ] Cores: só os tokens do site; nenhum hex solto nos `.css` das views.
- [ ] O `launcher.css` original foi removido ou tem menos de 200 linhas; `!important` < 20.
- [ ] Um screenshot do launcher ao lado de um do site parece ser do mesmo produto.

---

## 7. Status da implementação (22/10/2026)

**Implementado:** tela principal (Ficha + Gazeta + Torre + barra XP), Passaporte (login), boas-vindas, espera do login Microsoft, Oficina (configurações com abas no topo), modais, loading do broto, toasts, hotbar e tickets no visual novo.

**Arquivos de estilo:** `assets/css/{fonts,tokens,base,components}.css` e `assets/css/views/{landing,login,settings,overlay}.css`. Os antigos `launcher.css`, `theme.css`, `layout.css` e `uipolish.js` do Helios foram removidos. Backup do estado anterior em `../backups/app-pre-redesign-v6-2026-10-22.tar.gz`.

**Dados que a interface consome do `distribution.json`:**

```jsonc
"news":    [{ "title": "", "content": "", "date": "2026-10-22", "category": "Decreto", "author": "", "kingdom": "Timenor", "image": "https://…", "video": "https://youtu.be/…", "link": "https://…" }],
"journal": [ /* mesmo formato: aba Crônicas */ ],
"events":  [{ "title": "Feira de Miralac", "date": "2026-10-25T20:00:00-03:00", "kingdom": "Miralac", "description": "", "link": "https://…" }]
```

O carimbo colorido sai da `category`: decreto, evento, patch/boletim, crônica/lore, recrutamento/apoio.

**Links da hotbar:** ficam em `assets/lang/_custom.toml` (`shortcutStoreURL`, `shortcutRulesURL`, `shortcutSiteURL`, `mediaDiscordURL`). Um link `"#"` deixa o slot trancado com a etiqueta "em breve".

**Pendente:** a tela de Perfil completa (2.3) depende de um endpoint do site com reino, cargo, horas jogadas e tier de apoio. Também ficou pendente a skin 3D (skinview3d); hoje a ficha usa um render 2D do mc-heads.
