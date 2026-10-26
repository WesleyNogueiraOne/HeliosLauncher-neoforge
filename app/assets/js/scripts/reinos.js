/**
 * reinos.js: os sete reinos de Selenia (fonte única: carrossel do login, tema da
 * ficha e falas da barra de XP).
 *
 * O jogador escolhe o reino na ficha. A escolha fica só neste PC (localStorage) e
 * muda o tom da interface via [data-reino] no <html> (cores em landing.css). O
 * dourado da marca nunca muda: o reino só pinta o acento (--teal), o halo e a ficha.
 */
(function () {
    'use strict'

    const KEY = 'rc.reino'

    // c / soft: acento do reino. tint: fundo da ficha. lore: falas por etapa do launch.
    const REINOS = [
        { id: 'shinkairen', name: 'Shin Kairen', epithet: 'A Vila da Lâmina Oculta', root: 'Fundada por Fujitsu Kaoro aos pés do Monte Hinguru',
            c: '#e88aa8', soft: '#f3b6c8', tint: '42, 24, 34',
            lore: {
                baixar: ['Pétalas de cerejeira caem sobre a estrada de Shin Kairen…', 'Afiando lâminas aos pés do Monte Hinguru…', 'Mensageiros cruzam a névoa com pergaminhos novos…'],
                conferir: ['Os monges conferem cada selo do pergaminho…'],
                partida: ['A Lâmina Oculta abre caminho na névoa…']
            } },
        { id: 'wargheim', name: 'Wargheim', epithet: 'A Fortaleza dos Lobos', root: 'Warg: lobo · Heim: fortaleza',
            c: '#9db8d2', soft: '#c6d8ea', tint: '22, 30, 40',
            lore: {
                baixar: ['Os lobos uivam: suprimentos chegando a Wargheim…', 'Forjando escudos nas muralhas da fortaleza…', 'Trenós atravessam a neve com caixotes novos…'],
                conferir: ['A guarda confere cada carga no portão norte…'],
                partida: ['Os portões de Wargheim se abrem ao seu passo…']
            } },
        { id: 'sahiin', name: 'Sahiin', epithet: 'A Flor do Deserto', root: 'Templos de serpente sob a areia',
            c: '#e39a66', soft: '#f0c09c', tint: '40, 28, 20',
            lore: {
                baixar: ['Caravanas atravessam as dunas de Sahiin…', 'As serpentes do templo guardam sua bagagem…', 'Mercadores descarregam especiarias no oásis…'],
                conferir: ['Os sacerdotes contam cada grão de areia…'],
                partida: ['A Flor do Deserto desabrocha pra você…']
            } },
        { id: 'miralac', name: 'Miralac', epithet: 'O Lago Espelhado', root: 'Piratas, peixes-dragão e a Taverna Queixo Caído',
            c: '#4fb8cc', soft: '#93d4e2', tint: '16, 32, 38',
            lore: {
                baixar: ['Piratas descarregam o porão no Lago Espelhado…', 'Uma rodada na Taverna Queixo Caído enquanto espera…', 'Peixes-dragão escoltam o navio de suprimentos…'],
                conferir: ['O contramestre confere o mapa do tesouro…'],
                partida: ['Velas içadas rumo a Miralac…']
            } },
        { id: 'timenor', name: 'Timenor', epithet: 'O Reino dos Colossais', root: 'Vapor e engenho · Progresso e Ordem',
            c: '#6fb59a', soft: '#a2d4bf', tint: '20, 34, 30',
            lore: {
                baixar: ['As caldeiras de Timenor ganham pressão…', 'Engrenagens colossais giram: progresso e ordem…', 'O trem de carga apita na estação central…'],
                conferir: ['Os engenheiros calibram cada válvula…'],
                partida: ['O apito a vapor anuncia sua chegada…']
            } },
        { id: 'cinndor', name: 'Cinndor', epithet: 'A Cidade das Cinzas', root: 'Onde o Rei Rato dita as regras',
            c: '#e0705a', soft: '#f0a493', tint: '40, 22, 20',
            lore: {
                baixar: ['Os ratos de Cinndor contrabandeiam seus pacotes…', 'Brasas ainda quentes nas ruas de cinza…', 'Um beco escuro, uma entrega discreta…'],
                conferir: ['O Rei Rato confere se ninguém roubou nada…'],
                partida: ['O Rei Rato permite sua entrada… por enquanto.']
            } },
        { id: 'dargor', name: 'Dargor', epithet: 'A Montanha Solitária', root: 'Minas profundas e cristais vivos',
            c: '#a58cf0', soft: '#c7b7f7', tint: '30, 24, 44',
            lore: {
                baixar: ['Os mineiros de Dargor sobem com cristais vivos…', 'Ecos nas minas profundas da Montanha Solitária…', 'Vagonetes carregados rangem nos trilhos…'],
                conferir: ['Os anões conferem cada cristal contra a luz…'],
                partida: ['A Montanha Solitária abre suas galerias…']
            } }
    ]

    // Falas de Selenia (sem reino, ou etapa que o reino não personaliza).
    const SELENIA = {
        mapa: ['Desenrolando o mapa de Selenia…'],
        conferir: ['Conferindo a bagagem, item por item…', 'O cronista confere cada página do diário…'],
        baixar: ['As carroças trazem suprimentos novos…', 'Mensageiros cruzam a estrada com novidades…', 'Descarregando caixotes no porto…'],
        prep: ['Selando o cavalo…', 'Ajustando as correias da armadura…'],
        partida: ['Os portões de Selenia se abrem…'],
        chegada: ['Boa viagem, viajante.']
    }

    // Texto técnico do launch (já traduzido) -> etapa da narração.
    const STAGES = {
        'landing.dlAsync.loadingServerInfo': 'mapa',
        'landing.dlAsync.pleaseWait': 'prep',
        'landing.launch.pleaseWait': 'prep',
        'landing.dlAsync.validatingFileIntegrity': 'conferir',
        'landing.dlAsync.downloadingFiles': 'baixar',
        'landing.dlAsync.preparingToLaunch': 'prep',
        'landing.dlAsync.launchingGame': 'partida',
        'landing.dlAsync.doneEnjoyServer': 'chegada'
    }
    let stageByText = null
    function stageOf(text) {
        if(!stageByText) {
            stageByText = {}
            for(const [k, v] of Object.entries(STAGES)) {
                try { stageByText[Lang.queryJS(k)] = v } catch { /* chave ausente na língua */ }
            }
            stageByText['Terminando a atualização do modpack…'] = 'baixar'
        }
        return stageByText[text] || null
    }

    function read() { try { return localStorage.getItem(KEY) } catch { return null } }
    function write(id) { try { id ? localStorage.setItem(KEY, id) : localStorage.removeItem(KEY) } catch { /* sem storage: vale só nesta sessão */ } }

    let current = REINOS.find(r => r.id === read()) || null

    function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c])) }

    function apply() {
        const root = document.documentElement
        if(current) {
            root.dataset.reino = current.id
            root.style.setProperty('--realm', current.c)
            root.style.setProperty('--realm-soft', current.soft)
            root.style.setProperty('--realm-tint', current.tint)
        } else {
            delete root.dataset.reino
            ;['--realm', '--realm-soft', '--realm-tint'].forEach(p => root.style.removeProperty(p))
        }
        const dd = document.getElementById('rcFichaReino')
        if(dd) {
            dd.innerHTML = current
                ? `<button type="button" class="rc-reino-pick is-set" title="${esc(current.epithet)}"><i></i>${esc(current.name)}</button>`
                : '<button type="button" class="rc-reino-pick">Escolher</button>'
        }
        const eyebrow = document.getElementById('rcFichaEyebrow')
        if(eyebrow) eyebrow.textContent = current ? `Viajante de ${current.name}` : 'Ficha do viajante'
    }

    function choose(id) {
        const next = REINOS.find(r => r.id === id) || null
        if((next && next.id) === (current && current.id)) return close()
        current = next
        write(current ? current.id : null)
        apply()
        close()
        if(window.rcToast) {
            if(current) window.rcToast('Reino escolhido', `Bem-vindo a ${current.name}, ${current.epithet.charAt(0).toLowerCase() + current.epithet.slice(1)}.`, '⚑')
            else window.rcToast('Sem bandeira', 'Você viaja por Selenia sem reino.', '◆')
        }
    }

    // ── seletor (popover na ficha)
    let pop = null
    function close() {
        if(!pop) return
        pop.remove(); pop = null
        document.removeEventListener('mousedown', outside, true)
        document.removeEventListener('keydown', onKey, true)
    }
    function outside(e) { if(pop && !pop.contains(e.target) && !e.target.closest('.rc-reino-pick')) close() }
    function onKey(e) { if(e.key === 'Escape') { e.stopPropagation(); close() } }

    function open() {
        if(pop) return close()
        const ficha = document.getElementById('rcFicha')
        pop = document.createElement('div')
        pop.className = 'rc-reino-pop'
        pop.setAttribute('role', 'dialog')
        pop.setAttribute('aria-label', 'Escolha seu reino')
        pop.innerHTML = `<div class="rc-reino-pop-head"><span class="rc-eyebrow">Sob qual bandeira?</span><small>Muda o tom do launcher. Fica só neste PC.</small></div>
            <div class="rc-reino-grid">${REINOS.map(r => `
                <button class="rc-reino-opt${current && current.id === r.id ? ' is-active' : ''}" data-reino="${r.id}" style="--c:${r.c}">
                    <i></i><b>${esc(r.name)}</b><small>${esc(r.epithet)}</small>
                </button>`).join('')}
            </div>
            <button class="rc-link rc-reino-none" data-reino="">Viajar sem reino</button>`
        pop.addEventListener('click', e => {
            const b = e.target.closest('[data-reino]')
            if(b) choose(b.dataset.reino)
        })
        ficha.appendChild(pop)
        setTimeout(() => {
            document.addEventListener('mousedown', outside, true)
            document.addEventListener('keydown', onKey, true)
        })
    }

    // ── narração da barra de XP
    let narrTimer = null
    function narrate(el, details) {
        clearInterval(narrTimer)
        narrTimer = null
        const stage = stageOf(details)
        if(!stage) { el.innerHTML = details; return }
        const own = current && current.lore[stage]
        const lines = own || SELENIA[stage] || []
        if(!lines.length) { el.innerHTML = details; return }
        let i = Math.floor(Math.random() * lines.length)
        const paint = () => {
            el.innerHTML = `<span class="rc-xp-lore">${esc(lines[i])}</span><small class="rc-xp-tech">${details}</small>`
        }
        paint()
        // Etapas longas (download): troca a fala de tempos em tempos.
        if(lines.length > 1) narrTimer = setInterval(() => { i = (i + 1) % lines.length; paint() }, 5000)
    }

    window.RC_REINOS = REINOS
    window.rcReinos = { get current() { return current }, open, choose, narrate, apply }

    // O tema entra antes da primeira pintura da landing.
    apply()
    document.addEventListener('click', e => { if(e.target.closest('.rc-reino-pick')) open() })
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply)
})()
