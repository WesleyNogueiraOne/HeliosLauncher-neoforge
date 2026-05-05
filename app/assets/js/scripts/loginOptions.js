const loginOptionsCancelContainer = document.getElementById('loginOptionCancelContainer')
const loginOptionMicrosoft = document.getElementById('loginOptionMicrosoft')
const loginOptionMojang = document.getElementById('loginOptionMojang')
const loginOptionOffline = document.getElementById('loginOptionOffline')
const loginOptionsCancelButton = document.getElementById('loginOptionCancelButton')
const offlineLoginForm = document.getElementById('offlineLoginForm')
const offlineUsernameInput = document.getElementById('offlineUsernameInput')
const offlineLoginConfirm = document.getElementById('offlineLoginConfirm')
const offlineLoginBack = document.getElementById('offlineLoginBack')

let loginOptionsCancellable = false

let loginOptionsViewOnLoginSuccess
let loginOptionsViewOnLoginCancel
let loginOptionsViewOnCancel
let loginOptionsViewCancelHandler

function loginOptionsCancelEnabled(val){
    if(val){
        $(loginOptionsCancelContainer).show()
    } else {
        $(loginOptionsCancelContainer).hide()
    }
}

loginOptionMicrosoft.onclick = (e) => {
    switchView(getCurrentView(), VIEWS.waiting, 500, 500, () => {
        ipcRenderer.send(
            MSFT_OPCODE.OPEN_LOGIN,
            loginOptionsViewOnLoginSuccess,
            loginOptionsViewOnLoginCancel
        )
    })
}

loginOptionMojang.onclick = (e) => {
    switchView(getCurrentView(), VIEWS.login, 500, 500, () => {
        loginViewOnSuccess = loginOptionsViewOnLoginSuccess
        loginViewOnCancel = loginOptionsViewOnLoginCancel
        loginCancelEnabled(true)
    })
}

loginOptionOffline.onclick = (e) => {
    // Esconde os botões e mostra o formulário offline
    document.querySelector('.loginOptionActions').style.display = 'none'
    offlineLoginForm.style.display = 'block'
    offlineUsernameInput.focus()
}

offlineLoginBack.onclick = (e) => {
    // Volta para os botões
    offlineLoginForm.style.display = 'none'
    document.querySelector('.loginOptionActions').style.display = 'block'
    offlineUsernameInput.value = ''
}

offlineLoginConfirm.onclick = async (e) => {
    const username = offlineUsernameInput.value.trim()

    // Validação do nickname
    if(username.length < 3) {
        offlineUsernameInput.style.borderColor = 'red'
        offlineUsernameInput.placeholder = 'Mínimo 3 caracteres!'
        return
    }
    if(!/^[a-zA-Z0-9_]+$/.test(username)) {
        offlineUsernameInput.style.borderColor = 'red'
        offlineUsernameInput.placeholder = 'Apenas letras, números e _'
        return
    }

    offlineUsernameInput.style.borderColor = '#444'
    offlineLoginConfirm.disabled = true
    offlineLoginConfirm.textContent = 'Entrando...'

    try {
        const authManager = require('./assets/js/authmanager')
        const account = authManager.addOfflineAccount(username)

        // Redireciona para a tela principal
        switchView(getCurrentView(), loginOptionsViewOnLoginSuccess, 500, 500)
    } catch(err) {
        console.error('Offline login error:', err)
        offlineLoginConfirm.disabled = false
        offlineLoginConfirm.textContent = 'Entrar'
        offlineUsernameInput.style.borderColor = 'red'
        offlineUsernameInput.placeholder = 'Erro ao entrar, tente novamente'
    }
}

// Permite pressionar Enter para confirmar
offlineUsernameInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') {
        offlineLoginConfirm.click()
    }
})

loginOptionsCancelButton.onclick = (e) => {
    switchView(getCurrentView(), loginOptionsViewOnCancel, 500, 500, () => {
        // Clear login values (Mojang login)
        // No cleanup needed for Microsoft.
        loginUsername.value = ''
        loginPassword.value = ''
        if(loginOptionsViewCancelHandler != null){
            loginOptionsViewCancelHandler()
            loginOptionsViewCancelHandler = null
        }
    })
}