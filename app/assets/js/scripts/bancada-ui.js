/**
 * bancada-ui.js: aba BANCADA da Gazeta (renderer) + guarda de mods antes do launch.
 * Lógica em ../bancada.js. Visual nas classes .rc-bancada* / .rc-item* (landing.css).
 */
(function () {
    'use strict'
    const path = require('path')
    const Bancada = require('./assets/js/bancada')

    const busy = new Map() // id -> % enquanto baixa
    let filter = 'Todos'

    function listEl() { return document.getElementById('rcBancadaList') }

    async function context() {
        const distro = await DistroAPI.getDistribution()
        const serv = distro.getServerById(ConfigManager.getSelectedServer())
        return { distro, raw: distro.rawDistribution, serv }
    }

    // Mexer na pasta com o jogo aberto não vale pra sessão atual (e no Windows o jar fica travado).
    function locked() {
        return document.body.classList.contains('rc-in-game') || document.getElementById('launch_content').style.display === 'none'
    }

    function portalName(serv) {
        const parts = String(serv.rawServer.name).split(' · ')
        return serv.rawServer.shortName || parts[parts.length - 1]
    }

    function itemCard({ item, installed, outdated }) {
        const pct = busy.get(item.id)
        const icon = rcSafeUrl(item.icon)
        let action
        if(pct != null) action = `<button class="rc-btn-gold rc-btn-sm" disabled>Forjando… ${pct}%</button>`
        else if(outdated) action = `<button class="rc-btn-gold rc-btn-sm" data-act="install" data-id="${rcEscape(item.id)}">Atualizar</button>`
        else if(installed) action = `<button class="rc-btn-ghost rc-btn-sm" data-act="remove" data-id="${rcEscape(item.id)}">Guardar</button>`
        else action = `<button class="rc-btn-gold rc-btn-sm" data-act="install" data-id="${rcEscape(item.id)}">Equipar</button>`
        return `
        <article class="rc-item${installed ? ' is-equipped' : ''}">
            <div class="rc-item-icon">${icon ? `<img src="${rcEscape(icon)}" alt="" loading="lazy">` : '<span>⚒</span>'}</div>
            <div class="rc-item-body">
                <div class="rc-item-top">
                    <b class="rc-item-name">${rcEscape(item.name || item.id)}</b>
                    ${item.category ? `<span class="rc-chip rc-chip--arcane">${rcEscape(item.category)}</span>` : ''}
                </div>
                <p class="rc-item-desc">${rcEscape(item.desc || '')}</p>
                <div class="rc-item-foot">
                    <span class="rc-item-ver">${rcEscape(item.versionName || '')}</span>
                    ${action}
                </div>
            </div>
        </article>`
    }

    function bagRow(mod, blockedRules) {
        const rule = Bancada.matchBlocked(mod, blockedRules)
        const label = mod.name || mod.modId || path.basename(mod.file)
        const status = rule
            ? '<span class="rc-chip rc-chip--danger">proibido</span>'
            : '<span class="rc-chip">por sua conta</span>'
        const why = rule ? `<small class="rc-bag-why">${rcEscape([rule.reason, rule.rule].filter(Boolean).join(' · '))}</small>` : ''
        return `<li class="rc-bag-row${rule ? ' is-blocked' : ''}"><span class="rc-bag-name"><b>${rcEscape(label)}</b><small>${rcEscape(mod.rel)}</small>${why}</span>${status}</li>`
    }

    async function render() {
        const list = listEl(); if(!list) return
        let ctx
        try { ctx = await context() } catch { return }
        const { raw, serv } = ctx
        if(!serv) { list.innerHTML = '<div class="rc-empty"><b>Nenhum portal escolhido.</b>Escolha uma versão na ficha.</div>'; return }

        const id = serv.rawServer.id
        const cfg = Bancada.config(raw)
        const state = Bancada.catalogState(raw, id)
        const equipped = state.filter(s => s.installed).length
        const cats = ['Todos', ...new Set(state.map(s => s.item.category).filter(Boolean))]
        if(!cats.includes(filter)) filter = 'Todos'
        const shown = state.filter(s => filter === 'Todos' || s.item.category === filter)
        const own = Bancada.scanPlayerMods(id, serv.rawServer.minecraftVersion).filter(m => m.source === 'player')
        const isLocked = locked()
        const grid = state.length
            ? `<div class="rc-bancada-grid${isLocked ? ' is-locked' : ''}">${shown.map(itemCard).join('')}</div>`
            : '<div class="rc-empty"><b>A forja está fria.</b>A staff ainda não liberou mods opcionais para esta versão.</div>'
        const bag = own.length
            ? `<ul class="rc-bag-list">${own.map(m => bagRow(m, cfg.blocked)).join('')}</ul>`
            : '<p class="rc-bag-empty">Nenhum mod seu na pasta. Mods fora do catálogo ficam por sua conta; os proibidos são desativados antes do jogo abrir.</p>'

        list.innerHTML = `
        <header class="rc-bancada-head">
            <div>
                <span class="rc-eyebrow">Bancada do artífice</span>
                <h3 class="rc-bancada-title">Mods opcionais · ${rcEscape(portalName(serv))}</h3>
                <p class="rc-bancada-sub">Aprovados pela staff, só no seu jogo. Equipe, guarde ou troque quando quiser.</p>
            </div>
            <div class="rc-bancada-count"><b>${equipped}</b><span>de ${state.length}<br>equipados</span></div>
        </header>
        ${isLocked ? '<div class="rc-bancada-lock">◆ Feche o jogo para mexer na bancada.</div>' : ''}
        ${cats.length > 2 ? `<nav class="rc-bancada-cats">${cats.map(c => `<button class="rc-chip${c === filter ? ' rc-chip--gold' : ''}" data-cat="${rcEscape(c)}">${rcEscape(c)}</button>`).join('')}</nav>` : ''}
        ${grid}
        <section class="rc-bag">
            <div class="rc-bag-head">
                <span class="rc-eyebrow">Sua mochila</span>
                <button class="rc-link" data-act="folder">abrir pasta de mods</button>
            </div>
            ${bag}
        </section>`
    }

    async function onClick(e) {
        const cat = e.target.closest('[data-cat]')
        if(cat) { filter = cat.dataset.cat; render(); return }
        const btn = e.target.closest('[data-act]')
        if(!btn) return
        const { raw, serv } = await context()
        const id = serv.rawServer.id
        if(btn.dataset.act === 'folder') {
            const dir = Bancada.modsDir(id)
            require('fs-extra').ensureDirSync(dir)
            shell.openPath(dir)
            return
        }
        if(locked()) { window.rcToast && window.rcToast('Bancada travada', 'Feche o jogo para mexer nos mods.', '◆', 2500); return }
        const entry = Bancada.catalogState(raw, id).find(s => s.item.id === btn.dataset.id)
        if(!entry) return
        if(btn.dataset.act === 'remove') {
            Bancada.uninstall(id, entry.item.id)
            render()
            return
        }
        busy.set(entry.item.id, 0); render()
        try {
            await Bancada.install(id, entry.item, pct => {
                busy.set(entry.item.id, pct)
                const b = listEl().querySelector('.rc-btn-gold[disabled]')
                if(b) b.textContent = `Forjando… ${pct}%`
            })
            window.rcToast && window.rcToast(entry.outdated ? 'Item aprimorado' : 'Item equipado', entry.item.name || entry.item.id, '⚒')
        } catch(err) {
            window.rcToast && window.rcToast('A forja falhou', err.message || 'Tente de novo.', '!', 5000)
        } finally {
            busy.delete(entry.item.id)
            render()
        }
    }

    /**
     * Chamado pelo Jogar (landing.js · dlAsync) antes de montar o processo.
     * Atualiza os mods da Bancada e desativa os proibidos.
     * @returns {Promise<boolean>} false se o jogador cancelou.
     */
    async function guard(distro, serv) {
        const raw = distro.rawDistribution
        const id = serv.rawServer.id
        try {
            const changes = await Bancada.syncInstalled(raw, id)
            changes.filter(c => c.action === 'updated').forEach(c => window.rcToast && window.rcToast('Item aprimorado', c.name || c.id, '⚒'))
        } catch(err) {
            // Mod opcional desatualizado não impede a viagem.
            console.warn('[Bancada] Falha ao atualizar mods opcionais.', err)
        }

        const found = Bancada.findBlocked(raw, id, serv.rawServer.minecraftVersion)
        if(!found.length) return true
        found.forEach(m => Bancada.disable(m.file))
        render()

        const rules = rcSafeUrl(Bancada.config(raw).rulesUrl)
        const rows = found.map(m => `<li><b>${rcEscape(m.name || m.modId || path.basename(m.file))}</b> · ${rcEscape([m.rule.reason, m.rule.rule].filter(Boolean).join(' · ') || 'proibido no Root RP')}</li>`).join('')
        return new Promise(resolve => {
            setOverlayContent(
                'Mods proibidos desativados',
                `<p>Estes mods não são permitidos no Root RP e foram desativados (o arquivo continua na pasta, com final <code>.disabled</code>):</p><ul class="rc-blocked-list">${rows}</ul>${rules ? `<p><a href="${rcEscape(rules)}">Ler as regras ↗</a></p>` : ''}`,
                'Continuar viagem',
                'Cancelar'
            )
            setOverlayHandler(() => { toggleOverlay(false); resolve(true) })
            setDismissHandler(() => { toggleOverlay(false); resolve(false) })
            toggleOverlay(true, true)
        })
    }

    function setup() {
        const list = listEl(); if(!list) return
        list.addEventListener('click', onClick)
    }

    window.rcBancada = {
        render() { if(listEl() && listEl().style.display !== 'none') return render() },
        guard
    }

    if(document.readyState !== 'loading') setup()
    else document.addEventListener('DOMContentLoaded', setup)
})()
