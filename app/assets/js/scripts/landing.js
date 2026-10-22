/**
 * Script for landing.ejs
 */
// Requirements
const { URL }                 = require('url')
const { getServerStatus }     = require('helios-core/mojang')
const { validateLocalFile }   = require('helios-core/common')
const {
    FullRepair,
    DistributionIndexProcessor,
    MojangIndexProcessor,
    downloadFile
}                             = require('helios-core/dl')
const {
    validateSelectedJvm,
    ensureJavaDirIsRoot,
    javaExecFromRoot,
    discoverBestJvmInstallation,
    latestOpenJDK,
    extractJdk
}                             = require('helios-core/java')

// Internal Requirements
const DiscordWrapper          = require('./assets/js/discordwrapper')
const ProcessBuilder          = require('./assets/js/processbuilder')

// Launch Elements
const launch_content          = document.getElementById('launch_content')
const launch_details          = document.getElementById('launch_details')
const launch_progress         = document.getElementById('launch_progress')
const launch_progress_label   = document.getElementById('launch_progress_label')
const launch_details_text     = document.getElementById('launch_details_text')
const server_selection_button = document.getElementById('server_selection_button')
const user_text               = document.getElementById('user_text')

const loggerLanding = LoggerUtil.getLogger('Landing')

/* Launch Progress Wrapper Functions */

/**
 * Show/hide the loading area.
 * 
 * @param {boolean} loading True if the loading area should be shown, otherwise false.
 */
function toggleLaunchArea(loading){
    if(loading){
        launch_details.style.display = 'flex'
        launch_content.style.display = 'none'
    } else {
        launch_details.style.display = 'none'
        launch_content.style.display = 'inline-flex'
    }
}

/**
 * Set the details text of the loading area.
 * 
 * @param {string} details The new text for the loading details.
 */
function setLaunchDetails(details){
    launch_details_text.innerHTML = details
}

/**
 * Set the value of the loading progress bar and display that value.
 * 
 * @param {number} percent Percentage (0-100)
 */
function setLaunchPercentage(percent){
    launch_progress.setAttribute('max', 100)
    launch_progress.setAttribute('value', percent)
    const _fill = document.getElementById('launch_progress_fill')
    if(_fill) _fill.style.width = percent + '%'
    launch_progress_label.innerHTML = percent + '%'
}

/**
 * Set the value of the OS progress bar and display that on the UI.
 * 
 * @param {number} percent Percentage (0-100)
 */
function setDownloadPercentage(percent){
    remote.getCurrentWindow().setProgressBar(percent/100)
    setLaunchPercentage(percent)
}

/**
 * Enable or disable the launch button.
 * 
 * @param {boolean} val True to enable, false to disable.
 */
function setLaunchEnabled(val){
    document.getElementById('launch_button').disabled = !val
}

// Bind launch button
document.getElementById('launch_button').addEventListener('click', async e => {
    loggerLanding.info('Launching game..')
    try {
        const server = (await DistroAPI.getDistribution()).getServerById(ConfigManager.getSelectedServer())
        const jExe = ConfigManager.getJavaExecutable(ConfigManager.getSelectedServer())
        if(jExe == null){
            await asyncSystemScan(server.effectiveJavaOptions)
        } else {

            setLaunchDetails(Lang.queryJS('landing.launch.pleaseWait'))
            toggleLaunchArea(true)
            setLaunchPercentage(0, 100)

            const details = await validateSelectedJvm(ensureJavaDirIsRoot(jExe), server.effectiveJavaOptions.supported)
            if(details != null){
                loggerLanding.info('Jvm Details', details)
                await dlAsync()

            } else {
                await asyncSystemScan(server.effectiveJavaOptions)
            }
        }
    } catch(err) {
        loggerLanding.error('Unhandled error in during launch process.', err)
        showLaunchFailure(Lang.queryJS('landing.launch.failureTitle'), Lang.queryJS('landing.launch.failureText'))
    }
})

// Bind settings button
document.getElementById('settingsMediaButton').onclick = async e => {
    await prepareSettings()
    switchView(getCurrentView(), VIEWS.settings)
}

// Bind avatar overlay button.
document.getElementById('avatarOverlay').onclick = async e => {
    await prepareSettings()
    switchView(getCurrentView(), VIEWS.settings, 500, 500, () => {
        settingsNavItemListener(document.getElementById('settingsNavAccount'), false)
    })
}

// Bind selected account
function updateSelectedAccount(authUser){
    let username = Lang.queryJS('landing.selectedAccount.noAccountSelected')
    if(authUser != null){
        if(authUser.displayName != null){
            username = authUser.displayName
        }
        if(authUser.uuid != null){
            document.getElementById('avatarContainer').style.backgroundImage = `url('https://mc-heads.net/body/${authUser.uuid}/240')`
        }
    }
    user_text.textContent = username
    if(window.rcSkin3D) window.rcSkin3D.setAccount(authUser)

    // selo embaixo do nome: tipo real da conta
    const tag = document.querySelector('.rc-account-tag')
    if(tag){
        const labels = { microsoft: 'Conta original', offline: 'Passaporte provisório' }
        tag.textContent = authUser == null ? 'Clique para entrar' : (labels[authUser.type] || '')
        tag.classList.toggle('rc-account-tag-none', authUser == null)
    }
    if(authUser == null) document.getElementById('avatarContainer').style.backgroundImage = ''
}
updateSelectedAccount(ConfigManager.getSelectedAccount())

// Bind selected server
function updateSelectedServer(serv){
    if(getCurrentView() === VIEWS.settings){
        fullSettingsSave()
    }
    ConfigManager.setSelectedServer(serv != null ? serv.rawServer.id : null)
    ConfigManager.save()
    server_selection_button.textContent = serv != null ? serv.rawServer.name : Lang.queryJS('landing.noSelection')
    document.getElementById('rcFichaServer').textContent = serv != null ? serv.rawServer.name : '—'
    document.getElementById('rcFichaVersion').textContent = serv != null ? serv.rawServer.minecraftVersion : '—'
    document.getElementById('rcFichaPack').textContent = serv != null ? 'v' + serv.rawServer.version : '—'
    if(getCurrentView() === VIEWS.settings){
        animateSettingsTabRefresh()
    }
    setLaunchEnabled(serv != null)
}
// Real text is set in uibinder.js on distributionIndexDone.
server_selection_button.textContent = Lang.queryJS('landing.selectedServer.loading')
server_selection_button.onclick = async e => {
    e.target.blur()
    await toggleServerSelection(true)
}

const refreshServerStatus = async () => {
    loggerLanding.info('Refreshing Server Status')
    const serv = (await DistroAPI.getDistribution()).getServerById(ConfigManager.getSelectedServer())

    let pLabel = Lang.queryJS('landing.serverStatus.server')
    let pVal = Lang.queryJS('landing.serverStatus.offline')
    let online = false
    let ping = null

    if(serv != null){
        document.getElementById('rcIp').textContent = serv.port && String(serv.port) !== '25565' ? `${serv.hostname}:${serv.port}` : serv.hostname
    }

    try {
        const t0 = performance.now()
        const servStat = await getServerStatus(47, serv.hostname, serv.port)
        ping = Math.round(performance.now() - t0)
        pLabel = Lang.queryJS('landing.serverStatus.players')
        pVal = servStat.players.online + ' / ' + servStat.players.max
        online = true
    } catch (err) {
        loggerLanding.warn('Unable to refresh server status, assuming offline.')
        loggerLanding.debug(err)
    }

    const dot = document.querySelector('.rc-server-status .status-dot')
    if(dot){
        dot.classList.toggle('online', online)
        dot.classList.toggle('offline', !online)
    }
    document.getElementById('landingPlayerLabel').innerHTML = pLabel
    document.getElementById('player_count').innerHTML = pVal

    // Ping: tempo de ida e volta do handshake de status.
    const pingEl = document.getElementById('rcPing')
    const bars = document.getElementById('rcPingBars')
    if(ping == null){
        pingEl.textContent = '—'
        bars.setAttribute('data-level', '0')
    } else {
        pingEl.textContent = ping + ' ms'
        bars.setAttribute('data-level', ping < 80 ? '4' : ping < 150 ? '3' : ping < 250 ? '2' : '1')
    }
}

/**
 * Shows an error overlay, toggles off the launch area.
 * 
 * @param {string} title The overlay title.
 * @param {string} desc The overlay description.
 */
function showLaunchFailure(title, desc){
    setOverlayContent(
        title,
        desc,
        Lang.queryJS('landing.launch.okay')
    )
    setOverlayHandler(null)
    toggleOverlay(true)
    toggleLaunchArea(false)
}

/* System (Java) Scan */

/**
 * Asynchronously scan the system for valid Java installations.
 * 
 * @param {boolean} launchAfter Whether we should begin to launch after scanning. 
 */
async function asyncSystemScan(effectiveJavaOptions, launchAfter = true){

    setLaunchDetails(Lang.queryJS('landing.systemScan.checking'))
    toggleLaunchArea(true)
    setLaunchPercentage(0, 100)

    const jvmDetails = await discoverBestJvmInstallation(
        ConfigManager.getDataDirectory(),
        effectiveJavaOptions.supported
    )

    if(jvmDetails == null) {
        // If the result is null, no valid Java installation was found.
        // Show this information to the user.
        setOverlayContent(
            Lang.queryJS('landing.systemScan.noCompatibleJava'),
            Lang.queryJS('landing.systemScan.installJavaMessage', { 'major': effectiveJavaOptions.suggestedMajor }),
            Lang.queryJS('landing.systemScan.installJava'),
            Lang.queryJS('landing.systemScan.installJavaManually')
        )
        setOverlayHandler(() => {
            setLaunchDetails(Lang.queryJS('landing.systemScan.javaDownloadPrepare'))
            toggleOverlay(false)
            
            try {
                downloadJava(effectiveJavaOptions, launchAfter)
            } catch(err) {
                loggerLanding.error('Unhandled error in Java Download', err)
                showLaunchFailure(Lang.queryJS('landing.systemScan.javaDownloadFailureTitle'), Lang.queryJS('landing.systemScan.javaDownloadFailureText'))
            }
        })
        setDismissHandler(() => {
            $('#overlayContent').fadeOut(250, () => {
                //$('#overlayDismiss').toggle(false)
                setOverlayContent(
                    Lang.queryJS('landing.systemScan.javaRequired', { 'major': effectiveJavaOptions.suggestedMajor }),
                    Lang.queryJS('landing.systemScan.javaRequiredMessage', { 'major': effectiveJavaOptions.suggestedMajor }),
                    Lang.queryJS('landing.systemScan.javaRequiredDismiss'),
                    Lang.queryJS('landing.systemScan.javaRequiredCancel')
                )
                setOverlayHandler(() => {
                    toggleLaunchArea(false)
                    toggleOverlay(false)
                })
                setDismissHandler(() => {
                    toggleOverlay(false, true)

                    asyncSystemScan(effectiveJavaOptions, launchAfter)
                })
                $('#overlayContent').fadeIn(250)
            })
        })
        toggleOverlay(true, true)
    } else {
        // Java installation found, use this to launch the game.
        const javaExec = javaExecFromRoot(jvmDetails.path)
        ConfigManager.setJavaExecutable(ConfigManager.getSelectedServer(), javaExec)
        ConfigManager.save()

        // We need to make sure that the updated value is on the settings UI.
        // Just incase the settings UI is already open.
        settingsJavaExecVal.value = javaExec
        await populateJavaExecDetails(settingsJavaExecVal.value)

        // TODO Callback hell, refactor
        // TODO Move this out, separate concerns.
        if(launchAfter){
            await dlAsync()
        }
    }

}

async function downloadJava(effectiveJavaOptions, launchAfter = true) {

    // TODO Error handling.
    // asset can be null.
    const asset = await latestOpenJDK(
        effectiveJavaOptions.suggestedMajor,
        ConfigManager.getDataDirectory(),
        effectiveJavaOptions.distribution)

    if(asset == null) {
        throw new Error(Lang.queryJS('landing.downloadJava.findJdkFailure'))
    }

    let received = 0
    await downloadFile(asset.url, asset.path, ({ transferred }) => {
        received = transferred
        setDownloadPercentage(Math.trunc((transferred/asset.size)*100))
    })
    setDownloadPercentage(100)

    if(received != asset.size) {
        loggerLanding.warn(`Java Download: Expected ${asset.size} bytes but received ${received}`)
        if(!await validateLocalFile(asset.path, asset.algo, asset.hash)) {
            log.error(`Hashes do not match, ${asset.id} may be corrupted.`)
            // Don't know how this could happen, but report it.
            throw new Error(Lang.queryJS('landing.downloadJava.javaDownloadCorruptedError'))
        }
    }

    // Extract
    // Show installing progress bar.
    remote.getCurrentWindow().setProgressBar(2)

    // Wait for extration to complete.
    const eLStr = Lang.queryJS('landing.downloadJava.extractingJava')
    let dotStr = ''
    setLaunchDetails(eLStr)
    const extractListener = setInterval(() => {
        if(dotStr.length >= 3){
            dotStr = ''
        } else {
            dotStr += '.'
        }
        setLaunchDetails(eLStr + dotStr)
    }, 750)

    const newJavaExec = await extractJdk(asset.path)

    // Extraction complete, remove the loading from the OS progress bar.
    remote.getCurrentWindow().setProgressBar(-1)

    // Extraction completed successfully.
    ConfigManager.setJavaExecutable(ConfigManager.getSelectedServer(), newJavaExec)
    ConfigManager.save()

    clearInterval(extractListener)
    setLaunchDetails(Lang.queryJS('landing.downloadJava.javaInstalled'))

    // TODO Callback hell
    // Refactor the launch functions
    asyncSystemScan(effectiveJavaOptions, launchAfter)

}

// Keep reference to Minecraft Process
let proc
// Is DiscordRPC enabled
let hasRPC = false
// Joined server regex
// Change this if your server uses something different.
const GAME_JOINED_REGEX = /\[.+\]: Sound engine started/
const GAME_LAUNCH_REGEX = /^\[.+\]: (?:MinecraftForge .+ Initialized|ModLauncher .+ starting: .+|Loading Minecraft .+ with Fabric Loader .+|Setting user: .+)$/
// O stdout do Java chega em blocos com várias linhas: testar linha a linha,
// senão as regex com ^...$ nunca casam e a tela fica presa em "preparando".
const forEachLine = (data, fn) => String(data).split(/\r?\n/).forEach(l => { l = l.trim(); if(l) fn(l) })
const MIN_LINGER = 5000

async function dlAsync(login = true) {

    // Login parameter is temporary for debug purposes. Allows testing the validation/downloads without
    // launching the game.

    const loggerLaunchSuite = LoggerUtil.getLogger('LaunchSuite')

    setLaunchDetails(Lang.queryJS('landing.dlAsync.loadingServerInfo'))

    let distro

    try {
        distro = await DistroAPI.refreshDistributionOrFallback()
        onDistroRefresh(distro)
    } catch(err) {
        loggerLaunchSuite.error('Unable to refresh distribution index.', err)
        showLaunchFailure(Lang.queryJS('landing.dlAsync.fatalError'), Lang.queryJS('landing.dlAsync.unableToLoadDistributionIndex'))
        return
    }

    const serv = distro.getServerById(ConfigManager.getSelectedServer())

    if(login) {
        if(ConfigManager.getSelectedAccount() == null){
            loggerLanding.error('You must be logged into an account.')
            return
        }
    }

    setLaunchDetails(Lang.queryJS('landing.dlAsync.pleaseWait'))
    toggleLaunchArea(true)
    setLaunchPercentage(0, 100)

    const fullRepairModule = new FullRepair(
        ConfigManager.getCommonDirectory(),
        ConfigManager.getInstanceDirectory(),
        ConfigManager.getLauncherDirectory(),
        ConfigManager.getSelectedServer(),
        DistroAPI.isDevMode()
    )

    fullRepairModule.spawnReceiver()

    fullRepairModule.childProcess.on('error', (err) => {
        loggerLaunchSuite.error('Error during launch', err)
        showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringLaunchTitle'), err.message || Lang.queryJS('landing.dlAsync.errorDuringLaunchText'))
    })
    fullRepairModule.childProcess.on('close', (code, _signal) => {
        if(code !== 0){
            loggerLaunchSuite.error(`Full Repair Module exited with code ${code}, assuming error.`)
            showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringLaunchTitle'), Lang.queryJS('landing.dlAsync.seeConsoleForDetails'))
        }
    })

    loggerLaunchSuite.info('Validating files.')
    setLaunchDetails(Lang.queryJS('landing.dlAsync.validatingFileIntegrity'))
    let invalidFileCount = 0
    try {
        invalidFileCount = await fullRepairModule.verifyFiles(percent => {
            setLaunchPercentage(percent)
        })
        setLaunchPercentage(100)
    } catch (err) {
        loggerLaunchSuite.error('Error during file validation.')
        showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringFileVerificationTitle'), err.displayable || Lang.queryJS('landing.dlAsync.seeConsoleForDetails'))
        return
    }
    

    if(invalidFileCount > 0) {
        loggerLaunchSuite.info('Downloading files.')
        setLaunchDetails(Lang.queryJS('landing.dlAsync.downloadingFiles'))
        setLaunchPercentage(0)
        try {
            await fullRepairModule.download(percent => {
                setDownloadPercentage(percent)
            })
            setDownloadPercentage(100)
        } catch(err) {
            loggerLaunchSuite.error('Error during file download.')
            showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringFileDownloadTitle'), err.displayable || Lang.queryJS('landing.dlAsync.seeConsoleForDetails'))
            return
        }
    } else {
        loggerLaunchSuite.info('No invalid files, skipping download.')
    }

    // Remove download bar.
    remote.getCurrentWindow().setProgressBar(-1)

    fullRepairModule.destroyReceiver()

    setLaunchDetails(Lang.queryJS('landing.dlAsync.preparingToLaunch'))

    const mojangIndexProcessor = new MojangIndexProcessor(
        ConfigManager.getCommonDirectory(),
        serv.rawServer.minecraftVersion)
    const distributionIndexProcessor = new DistributionIndexProcessor(
        ConfigManager.getCommonDirectory(),
        distro,
        serv.rawServer.id
    )

    const modLoaderData = await distributionIndexProcessor.loadModLoaderVersionJson(serv)
    const versionData = await mojangIndexProcessor.getVersionJson()

    if(login) {
        const authUser = ConfigManager.getSelectedAccount()
        loggerLaunchSuite.info(`Sending selected account (${authUser.displayName}) to ProcessBuilder.`)
        let pb = new ProcessBuilder(serv, versionData, modLoaderData, authUser, remote.app.getVersion())
        setLaunchDetails(Lang.queryJS('landing.dlAsync.launchingGame'))

        // const SERVER_JOINED_REGEX = /\[.+\]: \[CHAT\] [a-zA-Z0-9_]{1,16} joined the game/
        const SERVER_JOINED_REGEX = new RegExp(`\\[.+\\]: \\[CHAT\\] ${authUser.displayName} joined the game`)

        let loadCompleted = false
        const onLoadComplete = () => {
            if(loadCompleted) return
            loadCompleted = true
            toggleLaunchArea(false)
            if(hasRPC){
                DiscordWrapper.updateDetails(Lang.queryJS('landing.discord.loading'))
                proc.stdout.on('data', gameStateChange)
            }
            proc.stdout.removeListener('data', tempListener)
            proc.stderr.removeListener('data', gameErrorListener)
        }
        const start = Date.now()

        // Attach a temporary listener to the client output.
        // Will wait for a certain bit of text meaning that
        // the client application has started, and we can hide
        // the progress bar stuff.
        let launchDetected = false
        const tempListener = function(data){
            if(launchDetected) return
            forEachLine(data, line => {
                if(launchDetected || !GAME_LAUNCH_REGEX.test(line)) return
                launchDetected = true
                const diff = Date.now()-start
                if(diff < MIN_LINGER) {
                    setTimeout(onLoadComplete, MIN_LINGER-diff)
                } else {
                    onLoadComplete()
                }
            })
        }

        // Listener for Discord RPC.
        const gameStateChange = function(data){
            forEachLine(data, line => {
                if(SERVER_JOINED_REGEX.test(line)){
                    DiscordWrapper.updateDetails(Lang.queryJS('landing.discord.joined'))
                } else if(GAME_JOINED_REGEX.test(line)){
                    DiscordWrapper.updateDetails(Lang.queryJS('landing.discord.joining'))
                }
            })
        }

        const gameErrorListener = function(data){
            data = data.trim()
            if(data.indexOf('Could not find or load main class net.minecraft.launchwrapper.Launch') > -1){
                loggerLaunchSuite.error('Game launch failed, LaunchWrapper was not downloaded properly.')
                showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringLaunchTitle'), Lang.queryJS('landing.dlAsync.launchWrapperNotDownloaded'))
            }
        }

        try {
            // Instala o NeoForge na primeira vez (assincrono, com feedback).
            await pb.installNeoForgeIfNeeded((msg) => setLaunchDetails(msg))

            // Build Minecraft process.
            proc = pb.build()
            if(window.rcBackground){
                window.rcBackground.setGameRunning(true)
                proc.on('close', () => window.rcBackground.setGameRunning(false))
            }
            // Se o jogo fechar antes de ser detectado (crash, fechado cedo),
            // libera o botão em vez de deixar "preparando" pra sempre.
            proc.on('close', () => {
                if(!loadCompleted){
                    loadCompleted = true
                    toggleLaunchArea(false)
                    proc.stdout.removeListener('data', tempListener)
                    proc.stderr.removeListener('data', gameErrorListener)
                }
            })

            // Bind listeners to stdout.
            proc.stdout.on('data', tempListener)
            proc.stderr.on('data', gameErrorListener)

            setLaunchDetails(Lang.queryJS('landing.dlAsync.doneEnjoyServer'))

            // Init Discord Hook
            if(distro.rawDistribution.discord != null && serv.rawServer.discord != null){
                DiscordWrapper.initRPC(distro.rawDistribution.discord, serv.rawServer.discord)
                hasRPC = true
                proc.on('close', (code, signal) => {
                    loggerLaunchSuite.info('Shutting down Discord Rich Presence..')
                    DiscordWrapper.shutdownRPC()
                    hasRPC = false
                    proc = null
                })
            }

        } catch(err) {

            loggerLaunchSuite.error('Error during launch', err)
            showLaunchFailure(Lang.queryJS('landing.dlAsync.errorDuringLaunchTitle'), err.displayable || Lang.queryJS('landing.dlAsync.checkConsoleForDetails'))

        }
    }

}

/**
 * Gazeta de Selenia: feed de notícias, crônicas e eventos.
 * Os dados vêm do distribution.json (chaves "news", "journal" e "events").
 */

// ═══════════════════════════════ ABAS DA GAZETA
function rcShowGazetaTab(target){
    document.querySelectorAll('.news-tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === target))
    document.querySelectorAll('#rcGazeta .news-list').forEach(list => {
        list.style.display = list.getAttribute('data-content') === target ? 'flex' : 'none'
    })
    if(target === 'news') loadRootNews()
    if(target === 'journal') loadJournal()
    if(target === 'events') loadEvents()
    if(target === 'tickets' && window.rcLoadTickets) window.rcLoadTickets()
}
document.querySelectorAll('.news-tab').forEach(tab => {
    tab.addEventListener('click', () => rcShowGazetaTab(tab.getAttribute('data-tab')))
})

// Escapa texto vindo do distribution.json (a janela roda com nodeIntegration,
// então HTML cru aqui = execução de código no PC do jogador).
function rcEscape(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]))
}

function rcSafeUrl(u) {
    return typeof u === 'string' && /^https:\/\//i.test(u) ? u : null
}

function rcYouTubeId(u) {
    const m = typeof u === 'string' && u.match(/(?:embed\/|v=|youtu\.be\/|shorts\/)([\w-]{11})/)
    return m ? m[1] : null
}

// Datas "2026-10-13" são tratadas como data local (sem fuso), o resto vai direto pro Date.
function rcParseDate(d) {
    if(!d) return null
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
    const date = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(d)
    return isNaN(date) ? null : date
}

function rcFormatDate(d) {
    const date = rcParseDate(d)
    if(!date) return rcEscape(d || '')
    const days = Math.floor((Date.now() - date.getTime()) / 86400000)
    if(days === 0) return 'hoje'
    if(days === 1) return 'ontem'
    if(days > 1 && days < 7) return `há ${days} dias`
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Carimbo por categoria (mesmas cores do guia de estilo).
function rcCategoryChip(cat) {
    if(!cat) return ''
    const c = String(cat).toLowerCase()
    let mod = ''
    if(/decreto|anúncio|anuncio|oficial/.test(c)) mod = 'gold'
    else if(/evento/.test(c)) mod = 'arcane'
    else if(/patch|boletim|atualiza|técnic|tecnic|launcher/.test(c)) mod = 'teal'
    else if(/crônica|cronica|lore|lenda|história|historia/.test(c)) mod = 'lore'
    else if(/recrut|apoio|apoiador/.test(c)) mod = 'leaf'
    return `<span class="rc-chip${mod ? ' rc-chip--' + mod : ''}">${rcEscape(cat)}</span>`
}

function rcMedia(entry) {
    const image = rcSafeUrl(entry.image)
    const videoId = rcYouTubeId(entry.video)
    if(videoId) {
        return `<div class="news-media" data-url="https://www.youtube.com/watch?v=${videoId}" data-action="open">
            <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="" loading="lazy">
            <div class="news-video-play">▶</div>
        </div>`
    }
    if(image) {
        return `<div class="news-media" data-url="${rcEscape(image)}" data-action="open"><img src="${rcEscape(image)}" alt="" loading="lazy"></div>`
    }
    return ''
}

function rcKicker(entry) {
    const kingdom = entry.kingdom ? `<span class="news-kicker-date">${rcEscape(entry.kingdom)}</span>` : ''
    return `<div class="news-kicker">${rcCategoryChip(entry.category)}${kingdom}<span class="news-kicker-date">${rcFormatDate(entry.date)}</span></div>`
}

function rcByline(entry, withToggle) {
    const link = rcSafeUrl(entry.link)
    const parts = []
    if(withToggle) parts.push('<button class="news-readmore" data-action="toggle">Ler matéria completa</button>')
    if(link) parts.push(`<a class="news-readmore" href="${rcEscape(link)}">Abrir no site ↗</a>`)
    return `<div class="news-byline"><span>${entry.author ? 'Por ' + rcEscape(entry.author) : ''}</span><span>${parts.join(' · ')}</span></div>`
}

function renderLeadEntry(entry) {
    const media = rcMedia(entry)
    return `
        <article class="news-item news-item--lead${media ? '' : ' no-media'}">
            ${media}
            <div class="news-lead-text">
                ${rcKicker(entry)}
                <h3 class="news-item-title">${rcEscape(entry.title)}</h3>
                <p class="news-item-desc">${rcEscape(entry.content)}</p>
                ${rcByline(entry, String(entry.content || '').length > 320)}
            </div>
        </article>`
}

function renderBriefEntry(entry) {
    return `
        <article class="news-item news-item--brief" data-action="expand">
            ${rcMedia(entry)}
            ${rcKicker(entry)}
            <h3 class="news-item-title">${rcEscape(entry.title)}</h3>
            <p class="news-item-desc">${rcEscape(entry.content)}</p>
            ${rcByline(entry, false)}
        </article>`
}

function bindFeedActions(list) {
    list.querySelectorAll('[data-action="open"]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation()
            const url = rcSafeUrl(el.getAttribute('data-url'))
            if(url) shell.openExternal(url)
        })
    })
    list.querySelectorAll('[data-action="toggle"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.news-item')
            item.classList.toggle('is-open')
            btn.textContent = item.classList.contains('is-open') ? 'Recolher' : 'Ler matéria completa'
        })
    })
    list.querySelectorAll('[data-action="expand"]').forEach(el => {
        el.addEventListener('click', (e) => {
            if(e.target.closest('a')) return
            el.classList.toggle('is-open')
        })
    })
}

async function rcRawDistro() {
    const distro = await DistroAPI.getDistribution()
    return distro.rawDistribution || distro
}

async function loadFeed(listId, key, emptyTitle, emptyText, errorText) {
    const list = document.getElementById(listId)
    try {
        const raw = await rcRawDistro()
        const entries = Array.isArray(raw[key]) ? raw[key] : []
        if(key === 'news') updateEdition(entries.length)
        if(entries.length === 0) {
            list.innerHTML = `<div class="rc-empty"><b>${emptyTitle}</b>${emptyText}</div>`
            return
        }
        const [lead, ...rest] = entries
        list.innerHTML = renderLeadEntry(lead) + (rest.length
            ? `<div class="rc-also">Também nesta edição</div><div class="news-grid">${rest.map(renderBriefEntry).join('')}</div>`
            : '')
        bindFeedActions(list)
    } catch(e) {
        list.innerHTML = `<div class="rc-empty"><b>A prensa travou.</b>${errorText}</div>`
        console.error(`Erro ao carregar ${key}:`, e)
    }
}

function updateEdition(count) {
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    document.getElementById('rcEdition').textContent = `Edição nº ${Math.max(count, 1)} · ${today}`
}

function loadRootNews() {
    return loadFeed('rcNewsList', 'news', 'Nada na prensa ainda.', 'As próximas notícias de Selenia aparecem aqui.', 'Não deu pra carregar as notícias.')
}

function loadJournal() {
    return loadFeed('rcJournalList', 'journal', 'Nenhuma crônica publicada.', 'Lendas, relatos e histórias dos reinos vão aparecer aqui.', 'Não deu pra carregar as crônicas.')
}

// ═══════════════════════════════ EVENTOS
// Formato no distribution.json:
//   "events": [{ "title": "Feira de Miralac", "date": "2026-10-25T20:00:00-03:00",
//                "kingdom": "Miralac", "description": "...", "link": "https://..." }]
let rcEventsCache = []

function rcCountdown(date) {
    const diff = date.getTime() - Date.now()
    if(diff <= 0) return 'acontecendo agora'
    const m = Math.floor(diff / 60000)
    const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60
    if(d > 0) return `em ${d}d ${String(h).padStart(2, '0')}h`
    if(h > 0) return `em ${h}h ${String(mm).padStart(2, '0')}min`
    return `em ${mm}min`
}

function rcUpcomingEvents() {
    const now = Date.now() - 3 * 3600000 // mantém por 3h depois do início
    return rcEventsCache
        .map(e => ({ ...e, _date: rcParseDate(e.date) }))
        .filter(e => e._date && e._date.getTime() > now)
        .sort((a, b) => a._date - b._date)
}

function renderEvents() {
    const upcoming = rcUpcomingEvents()
    const isSoon = e => e._date.getTime() - Date.now() < 3600000

    const mini = document.getElementById('rcEventsMini')
    mini.innerHTML = upcoming.length === 0
        ? '<div class="rc-events-empty">Nenhum evento marcado. Os anúncios saem primeiro no Discord.</div>'
        : upcoming.slice(0, 3).map(e => `
            <div class="rc-mini-event${isSoon(e) ? ' is-soon' : ''}">
                <div class="rc-mini-event-when">${rcEscape(e._date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }))} · ${e._date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="rc-mini-event-title">${rcEscape(e.title)}</div>
                <div class="rc-mini-event-count">${rcCountdown(e._date)}</div>
            </div>`).join('')

    const full = document.getElementById('rcEventsList')
    full.innerHTML = upcoming.length === 0
        ? '<div class="rc-empty"><b>Calendário vazio.</b>Quando a staff marcar um evento, ele aparece aqui com contagem regressiva.</div>'
        : upcoming.map(e => {
            const link = rcSafeUrl(e.link)
            return `
            <div class="rc-event${isSoon(e) ? ' is-soon' : ''}">
                <div class="rc-event-date"><b>${e._date.getDate()}</b><span>${rcEscape(e._date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''))}</span></div>
                <div>
                    <div class="rc-event-title">${rcEscape(e.title)}</div>
                    <div class="rc-event-meta">${[e.kingdom, e._date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), e.description].filter(Boolean).map(rcEscape).join(' · ')}</div>
                    ${link ? `<a class="news-readmore" href="${rcEscape(link)}">Detalhes ↗</a>` : ''}
                </div>
                <div class="rc-event-count">${rcCountdown(e._date)}</div>
            </div>`
        }).join('')
}

async function loadEvents() {
    try {
        const raw = await rcRawDistro()
        rcEventsCache = Array.isArray(raw.events) ? raw.events : []
    } catch(e) {
        rcEventsCache = []
        console.error('Erro ao carregar eventos:', e)
    }
    renderEvents()
}
setInterval(() => { if(!document.hidden) renderEvents() }, 30000)

// ═══════════════════════════════ VÍNCULO COM O SITE (ficha)
async function refreshSiteLink() {
    const el = document.getElementById('rcFichaLink')
    const me = await ipcRenderer.invoke('rc:me').catch(() => null)
    if(me && !me.error) {
        el.textContent = 'Vinculado'
        el.classList.add('is-ok')
    } else {
        el.classList.remove('is-ok')
        el.innerHTML = '<button type="button">Vincular</button>'
        el.firstChild.onclick = () => rcShowGazetaTab('tickets')
    }
}
refreshSiteLink()
