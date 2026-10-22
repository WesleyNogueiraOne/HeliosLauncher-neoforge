/**
 * skin3d.js: personagem 3D na Ficha do viajante (skinview3d, MIT).
 * - Carrega a skin da conta selecionada (mc-heads.net, que libera CORS pro WebGL).
 * - Arrastar gira o personagem; passar o mouse faz ele acenar.
 * - Pausa o render com o jogo aberto, janela oculta ou fora da tela principal.
 * - Se WebGL ou a skin falharem, fica o render 2D de antes (background do #avatarContainer).
 */
(function () {
    'use strict'

    const host = document.getElementById('avatarContainer')
    const portrait = document.getElementById('user_content')
    if (!host || typeof skinview3d === 'undefined') return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const BASE_ROTATION = -0.42

    const canvas = document.createElement('canvas')
    canvas.id = 'rcSkinCanvas'
    canvas.setAttribute('aria-hidden', 'true')
    host.appendChild(canvas)

    let viewer
    try {
        viewer = new skinview3d.SkinViewer({
            canvas,
            width: Math.max(host.clientWidth, 1),
            height: Math.max(host.clientHeight, 1),
            pixelRatio: 'match-device',
            fov: 38,
            zoom: 0.86
        })
    } catch (e) {
        console.warn('[skin3d] WebGL indisponível, mantendo render 2D.', e)
        canvas.remove()
        return
    }

    viewer.background = null
    viewer.globalLight.intensity = 2.6
    viewer.cameraLight.intensity = 0.9
    viewer.controls.enableZoom = false
    viewer.controls.enablePan = false
    viewer.controls.enableRotate = true
    viewer.controls.minPolarAngle = Math.PI / 2 - 0.35
    viewer.controls.maxPolarAngle = Math.PI / 2 + 0.2
    viewer.playerWrapper.rotation.y = BASE_ROTATION

    const idle = new skinview3d.IdleAnimation()
    const wave = new skinview3d.WaveAnimation('right')
    wave.speed = 0.9
    viewer.animation = reduceMotion ? null : idle

    // ═══════════════════════════════ CARREGAR SKIN
    let currentKey = null
    async function setAccount(authUser) {
        if (!authUser) {
            currentKey = null
            host.classList.remove('is-3d')
            viewer.loadSkin(null)
            return
        }
        // Conta original: skin pelo UUID. Passaporte provisório: pelo apelido
        // (mesma regra que o SkinsRestorer costuma usar no servidor).
        const key = authUser.type === 'offline' ? authUser.displayName : authUser.uuid
        if (!key || key === currentKey) return
        currentKey = key
        try {
            await viewer.loadSkin(`https://mc-heads.net/skin/${encodeURIComponent(key)}`, { model: 'auto-detect' })
            if (currentKey !== key) return
            viewer.resetCameraPose()
            host.classList.add('is-3d')
        } catch (e) {
            console.warn('[skin3d] Não deu pra carregar a skin, mantendo render 2D.', e)
            if (currentKey === key) host.classList.remove('is-3d')
        }
    }
    window.rcSkin3D = { setAccount, viewer }

    // ═══════════════════════════════ TAMANHO
    new ResizeObserver(() => {
        const w = host.clientWidth, h = host.clientHeight
        if (w > 0 && h > 0) viewer.setSize(w, h)
    }).observe(host)

    // ═══════════════════════════════ INTERAÇÃO
    // Arrastar pra girar não pode virar "clique" no retrato (que abre a troca de conta).
    let downX = 0, downY = 0, dragged = false
    canvas.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; dragged = false })
    canvas.addEventListener('pointermove', e => {
        if (e.buttons && Math.hypot(e.clientX - downX, e.clientY - downY) > 4) dragged = true
    })
    portrait.addEventListener('click', e => {
        if (dragged) { e.stopImmediatePropagation(); e.preventDefault(); dragged = false }
    }, true)

    // Volta suave pra pose de frente quando solta, mantendo a distância da câmera.
    // (controls.reset() não serve: restaura a câmera de antes do enquadramento
    // e dá um zoom enorme no boneco.)
    let returnTimer = null, returnAnim = null
    function easeBackToFront() {
        const cam = viewer.camera
        const dist = cam.position.length()
        const from = cam.position.clone().normalize()
        const to = from.clone().set(0, 0, 1)
        const t0 = performance.now(), dur = 700
        const step = (now) => {
            const k = Math.min((now - t0) / dur, 1)
            const e = 1 - Math.pow(1 - k, 3)
            cam.position.copy(from.clone().lerp(to, e).normalize().multiplyScalar(dist))
            cam.lookAt(viewer.controls.target)
            viewer.controls.update()
            returnAnim = k < 1 ? requestAnimationFrame(step) : null
        }
        returnAnim = requestAnimationFrame(step)
    }
    viewer.controls.addEventListener('start', () => {
        clearTimeout(returnTimer)
        if (returnAnim) { cancelAnimationFrame(returnAnim); returnAnim = null }
    })
    viewer.controls.addEventListener('end', () => {
        clearTimeout(returnTimer)
        returnTimer = setTimeout(easeBackToFront, 2500)
    })

    if (!reduceMotion) {
        portrait.addEventListener('mouseenter', () => { viewer.animation = wave })
        portrait.addEventListener('mouseleave', () => { viewer.animation = idle })
    }

    // ═══════════════════════════════ ECONOMIA (não disputar GPU com o Minecraft)
    const landing = document.getElementById('landingContainer')
    function syncPaused() {
        const visible = landing.style.display !== 'none' && !document.hidden
        const inGame = document.body.classList.contains('rc-in-game')
        viewer.renderPaused = !visible || inGame
    }
    document.addEventListener('visibilitychange', syncPaused)
    new MutationObserver(syncPaused).observe(landing, { attributes: true, attributeFilter: ['style'] })
    new MutationObserver(syncPaused).observe(document.body, { attributes: true, attributeFilter: ['class'] })
    syncPaused()

    // Conta já selecionada na abertura (o landing.js roda antes deste script).
    try { setAccount(ConfigManager.getSelectedAccount()) } catch (e) { console.warn('[skin3d]', e) }
})()
