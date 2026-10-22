/**
 * rcui.js: interações da interface do Root Client.
 * Toasts (estilo conquista), hotbar de atalhos (teclas 1-5), copiar IP
 * e o carrossel de reinos do Passaporte (login).
 */
(function () {
    'use strict'

    // ═══════════════════════════════ TOAST
    window.rcToast = function (title, text, icon = '◆', ms = 4000) {
        const host = document.getElementById('rcToasts')
        if (!host) return
        const t = document.createElement('div')
        t.className = 'rc-toast'
        const i = document.createElement('div'); i.className = 'rc-toast-icon'; i.textContent = icon
        const b = document.createElement('div'); b.className = 'rc-toast-body'
        const h = document.createElement('div'); h.className = 'rc-toast-title'; h.textContent = title
        const p = document.createElement('div'); p.className = 'rc-toast-text'; p.textContent = text
        b.append(h, p); t.append(i, b); host.appendChild(t)
        setTimeout(() => {
            t.classList.add('out')
            t.addEventListener('animationend', () => t.remove(), { once: true })
        }, ms)
    }

    const isUsableUrl = u => typeof u === 'string' && /^https:\/\//i.test(u)

    // ═══════════════════════════════ HOTBAR
    function activateSlot(slot) {
        if (!slot || slot.classList.contains('is-locked')) return
        slot.classList.add('is-pressed')
        setTimeout(() => slot.classList.remove('is-pressed'), 160)
        if (slot.dataset.action === 'tickets') {
            if (typeof rcShowGazetaTab === 'function') rcShowGazetaTab('tickets')
            return
        }
        if (isUsableUrl(slot.dataset.url)) shell.openExternal(slot.dataset.url)
    }

    function setupHotbar() {
        document.querySelectorAll('.rc-slot').forEach(slot => {
            if (!slot.dataset.action && !isUsableUrl(slot.dataset.url)) {
                slot.classList.add('is-locked')
                slot.setAttribute('data-tip', slot.getAttribute('data-tip') + ' · em breve')
            }
            slot.addEventListener('click', () => activateSlot(slot))
        })

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return
            if (!/^[1-5]$/.test(e.key)) return
            if (e.target.closest('input, textarea, select, [contenteditable]')) return
            if (typeof getCurrentView !== 'function' || getCurrentView() !== VIEWS.landing) return
            if (document.getElementById('main').hasAttribute('overlay')) return
            activateSlot(document.querySelector(`.rc-slot[data-key="${e.key}"]`))
        })
    }

    // ═══════════════════════════════ COPIAR IP
    function setupCopyIp() {
        const btn = document.getElementById('rcCopyIp')
        if (!btn) return
        btn.addEventListener('click', () => {
            const ip = document.getElementById('rcIp').textContent.trim()
            if (!ip || ip === '—') return
            require('electron').clipboard.writeText(ip)
            window.rcToast('Endereço copiado', ip, '⧉', 2500)
        })
    }

    // ═══════════════════════════════ CARROSSEL DE REINOS (login)
    const KINGDOMS = [
        { name: 'Shin Kairen', epithet: 'A Vila da Lâmina Oculta', root: 'Fundada por Fujitsu Kaoro aos pés do Monte Hinguru' },
        { name: 'Wargheim', epithet: 'A Fortaleza dos Lobos', root: 'Warg: lobo · Heim: fortaleza' },
        { name: 'Sahiin', epithet: 'A Flor do Deserto', root: 'Templos de serpente sob a areia' },
        { name: 'Miralac', epithet: 'O Lago Espelhado', root: 'Piratas, peixes-dragão e a Taverna Queixo Caído' },
        { name: 'Timenor', epithet: 'O Reino dos Colossais', root: 'Vapor e engenho · Progresso e Ordem' },
        { name: 'Cinndor', epithet: 'A Cidade das Cinzas', root: 'Onde o Rei Rato dita as regras' },
        { name: 'Dargor', epithet: 'A Montanha Solitária', root: 'Minas profundas e cristais vivos' }
    ]

    function setupKingdoms() {
        const host = document.getElementById('rcKingdom')
        if (!host) return
        const nameEl = host.querySelector('.rc-kingdom-name')
        const epiEl = host.querySelector('.rc-kingdom-epithet')
        const rootEl = host.querySelector('.rc-kingdom-root')
        const dots = document.getElementById('rcKingdomDots')
        let idx = Math.floor(Math.random() * KINGDOMS.length)

        KINGDOMS.forEach((k, i) => {
            const d = document.createElement('button')
            d.className = 'rc-kingdom-dot'
            d.setAttribute('aria-label', k.name)
            d.addEventListener('click', () => { show(i); restart() })
            dots.appendChild(d)
        })

        function show(i) {
            idx = i
            const k = KINGDOMS[i]
            host.classList.remove('is-in'); void host.offsetWidth
            nameEl.textContent = k.name
            epiEl.textContent = k.epithet
            rootEl.textContent = k.root
            host.classList.add('is-in')
            Array.from(dots.children).forEach((d, j) => d.classList.toggle('active', j === i))
        }
        let timer
        function restart() {
            clearInterval(timer)
            timer = setInterval(() => {
                if (document.hidden) return
                const view = document.getElementById('loginOptionsContainer')
                if (view && view.style.display === 'none') return
                show((idx + 1) % KINGDOMS.length)
            }, 8000)
        }
        show(idx); restart()
    }

    function init() {
        setupHotbar()
        setupCopyIp()
        setupKingdoms()
    }
    if (document.readyState !== 'loading') init()
    else document.addEventListener('DOMContentLoaded', init)
})()
