// ============================================================
// Root Client — fundo animado + ligações da landing
// ============================================================

// Slideshow de fundo
const bgImages = [
    'assets/images/backgrounds/0.jpg',
    'assets/images/backgrounds/1.jpg',
    'assets/images/backgrounds/2.jpg'
]

const bgSlideshow = document.createElement('div')
bgSlideshow.id = 'bgSlideshow'
bgImages.forEach((src, i) => {
    const slide = document.createElement('div')
    slide.className = 'bgSlide' + (i === 0 ? ' active' : '')
    slide.style.backgroundImage = `url('${src}')`
    bgSlideshow.appendChild(slide)
})

// Alternar slides (pausa quando a janela não está visível)
let currentSlide = 0
setInterval(() => {
    if (document.hidden) return
    const slides = document.querySelectorAll('.bgSlide')
    if (!slides.length) return
    slides[currentSlide].classList.remove('active')
    currentSlide = (currentSlide + 1) % slides.length
    slides[currentSlide].classList.add('active')
}, 8000)

// Runas decorativas
const bgRunes = document.createElement('div')
bgRunes.id = 'bgRunes'
const runeChars = ['ᚱ', 'ᚦ', 'ᚷ', 'ᚹ', 'ᛗ', 'ᚾ', 'ᛁ', 'ᚻ']
runeChars.forEach(r => {
    const span = document.createElement('span')
    span.className = 'rune'
    span.textContent = r
    bgRunes.appendChild(span)
})

document.addEventListener('DOMContentLoaded', () => {

    // Inserir slideshow + runas no fundo (fixos, atrás de tudo)
    document.body.insertBefore(bgSlideshow, document.body.firstChild)
    document.body.insertBefore(bgRunes, document.body.firstChild)

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

    // Abrir seleção de conta
    const userContent = document.getElementById('user_content')
    if (userContent) userContent.addEventListener('click', (e) => {
        // o avatar tem ação própria (abre Configurações > Conta)
        if (e.target.closest('#avatarOverlay')) return
        try {
            prepareAccountSelectionList()
            bindOverlayKeys(true, 'accountSelectContent', true)
            $('#accountSelectContent').fadeIn(250)
        } catch(e) { console.log(e) }
    })
})
