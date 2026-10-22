// ============================================================
// Root Client — fundo animado + ligações da landing
// ============================================================

// Fundo: vídeo em loop. Se o vídeo falhar, cai pro slideshow de imagens.
const BG_VIDEO = 'assets/video/background.mp4'
const bgImages = [
    'assets/images/backgrounds/0.jpg',
    'assets/images/backgrounds/1.jpg',
    'assets/images/backgrounds/2.jpg'
]

const bgSlideshow = document.createElement('div')
bgSlideshow.id = 'bgSlideshow'

const bgVideo = document.createElement('video')
bgVideo.className = 'bgVideo'
bgVideo.muted = true
bgVideo.loop = true
bgVideo.autoplay = true
bgVideo.playsInline = true
bgVideo.preload = 'auto'
bgVideo.setAttribute('aria-hidden', 'true')
bgVideo.addEventListener('playing', () => bgSlideshow.classList.add('video-ready'), { once: true })
bgVideo.addEventListener('error', startSlideshow, { once: true })
bgSlideshow.appendChild(bgVideo)

// O file:// passa pelo ejs-electron, que não responde Range — o Chromium não toca
// vídeo assim. Lê o arquivo e toca via Blob URL.
require('fs').promises.readFile(require('path').join(__dirname, BG_VIDEO))
    .then(buf => { bgVideo.src = window.URL.createObjectURL(new Blob([buf], { type: 'video/mp4' })) })
    .catch(startSlideshow)

const bgShade = document.createElement('div')
bgShade.className = 'bgShade'
bgSlideshow.appendChild(bgShade)

let slideTimer = null
function startSlideshow(){
    if(slideTimer) return
    bgVideo.remove()
    bgImages.forEach((src, i) => {
        const slide = document.createElement('div')
        slide.className = 'bgSlide' + (i === 0 ? ' active' : '')
        slide.style.backgroundImage = `url('${src}')`
        bgSlideshow.insertBefore(slide, bgShade)
    })
    let current = 0
    slideTimer = setInterval(() => {
        if (document.hidden) return
        const slides = bgSlideshow.querySelectorAll('.bgSlide')
        slides[current].classList.remove('active')
        current = (current + 1) % slides.length
        slides[current].classList.add('active')
    }, 8000)
}

// Pausa o vídeo quando não dá pra ver (minimizado) ou com o jogo aberto,
// pra não gastar CPU/GPU que o Minecraft precisa.
let bgGameRunning = false
function syncBackgroundPlayback(){
    if(!bgVideo.isConnected) return
    if(document.hidden || bgGameRunning) bgVideo.pause()
    else bgVideo.play().catch(() => {})
}
document.addEventListener('visibilitychange', syncBackgroundPlayback)
window.rcBackground = {
    setGameRunning(running){
        bgGameRunning = !!running
        document.body.classList.toggle('rc-in-game', bgGameRunning)
        syncBackgroundPlayback()
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // Fundo fixo, atrás de tudo
    document.body.insertBefore(bgSlideshow, document.body.firstChild)

    // Versão real do app (vem do package.json)
    const versionEl = document.getElementById('rcVersion')
    if (versionEl) {
        try { versionEl.textContent = 'v' + require('@electron/remote').app.getVersion() } catch (e) { /* mantém o texto do template */ }
    }

    // Sincronizar nome do jogador
    const userText = document.getElementById('user_text')
    const userTextMain = document.getElementById('user_text_main')
    if (userText && userTextMain) {
        userTextMain.textContent = userText.textContent
        const obs = new MutationObserver(() => {
            userTextMain.textContent = userText.textContent
        })
        obs.observe(userText, { childList: true, subtree: true, characterData: true })
    }

    // Abrir seleção de conta (retrato da ficha ou link "Trocar conta")
    const openAccountSelect = () => {
        try {
            prepareAccountSelectionList()
            window.rcAccountSelectStandalone = true
            toggleOverlay(true, true, 'accountSelectContent')
        } catch(e) { console.log(e) }
    }
    const userContent = document.getElementById('user_content')
    if (userContent) userContent.addEventListener('click', (e) => {
        // o botão "gerenciar" tem ação própria (abre Oficina > Contas)
        if (e.target.closest('#avatarOverlay')) return
        openAccountSelect()
    })
    const switchBtn = document.getElementById('rcSwitchAccount')
    if (switchBtn) switchBtn.addEventListener('click', openAccountSelect)
})
