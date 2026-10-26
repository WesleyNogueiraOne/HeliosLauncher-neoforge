/**
 * bancada.js: mods client opcionais curados pela staff + guarda de mods proibidos.
 *
 * Formato no distribution.json (chave de topo "bancada", editada pelo distro-manager:
 * `node cli.js bancada ...`):
 *
 *   "bancada": {
 *     "rulesUrl": "https://...",               link da regra mostrado no bloqueio (opcional)
 *     "catalog": [{
 *       "id": "appleskin", "name": "AppleSkin", "category": "Interface",
 *       "desc": "…", "icon": "https://cdn.modrinth.com/…",
 *       "project": "EsAfCjCV", "version": "uAKA6Laj", "versionName": "3.0.9",
 *       "file": "appleskin-….jar", "url": "https://cdn.modrinth.com/…", "sha512": "…", "size": 123,
 *       "servers": ["MeuServidor"]              opcional: só nestas versões
 *     }],
 *     "blocked": [{ "modId": "freecam", "pattern": "freecam", "reason": "…", "rule": "Regra 4.2" }]
 *   }
 *
 * O launcher instala na pasta mods/ da instância (FML carrega tudo que está lá) e
 * guarda o que instalou em .rootclient/bancada.json, pra nunca mexer em mod do jogador
 * por engano. A versão, a URL e o sha512 vêm fixados do distro: o jogador só recebe
 * o arquivo exato que a staff aprovou.
 *
 * A guarda roda antes de abrir o jogo e desativa (.disabled) o que estiver proibido.
 * É uma camada do launcher, contornável: a barreira de verdade é no servidor.
 */
const fs      = require('fs-extra')
const path    = require('path')
const crypto  = require('crypto')
const AdmZip  = require('adm-zip')

const ConfigManager = require('./configmanager')
const { LoggerUtil } = require('helios-core')

const logger = LoggerUtil.getLogger('Bancada')
const MOD_FILE = /\.(jar|zip)$/i

function gameDir(serverId) { return path.join(ConfigManager.getInstanceDirectory(), serverId) }
function modsDir(serverId) { return path.join(gameDir(serverId), 'mods') }
function manifestPath(serverId) { return path.join(gameDir(serverId), '.rootclient', 'bancada.json') }

function readJson(file, fallback) {
    try { return fs.readJsonSync(file) } catch { return fallback }
}

/** { [id]: { file, version } } dos mods que a Bancada instalou nesta versão. */
function readManifest(serverId) { return readJson(manifestPath(serverId), {}) }
function writeManifest(serverId, m) { fs.outputJsonSync(manifestPath(serverId), m, { spaces: 2 }) }

/** Configuração da Bancada no distro, sempre com listas válidas. */
function config(rawDistro) {
    const b = (rawDistro && rawDistro.bancada) || {}
    return {
        rulesUrl: typeof b.rulesUrl === 'string' ? b.rulesUrl : null,
        catalog: Array.isArray(b.catalog) ? b.catalog.filter(i => i && i.id && i.url && i.sha512 && i.file) : [],
        blocked: Array.isArray(b.blocked) ? b.blocked.filter(r => r && (r.modId || r.pattern)) : []
    }
}

function catalogFor(rawDistro, serverId) {
    return config(rawDistro).catalog.filter(i => !Array.isArray(i.servers) || i.servers.includes(serverId))
}

/**
 * Estado de cada item do catálogo nesta versão.
 * @returns {{item: Object, installed: boolean, outdated: boolean}[]}
 */
function catalogState(rawDistro, serverId) {
    const man = readManifest(serverId)
    const dir = modsDir(serverId)
    return catalogFor(rawDistro, serverId).map(item => {
        const rec = man[item.id]
        const installed = !!rec && fs.existsSync(path.join(dir, rec.file))
        return { item, installed, outdated: installed && rec.version !== item.version }
    })
}

function sha512(buf) { return crypto.createHash('sha512').update(buf).digest('hex') }

/** Baixa o arquivo aprovado, confere o sha512 e troca a versão antiga (se houver). */
async function install(serverId, item, onProgress = () => {}) {
    const res = await fetch(item.url)
    if(!res.ok) throw new Error(`Download falhou (HTTP ${res.status}).`)
    const total = Number(res.headers.get('content-length')) || item.size || 0
    const reader = res.body.getReader()
    const chunks = []
    let got = 0
    for(;;) {
        const { done, value } = await reader.read()
        if(done) break
        chunks.push(value)
        got += value.length
        if(total) onProgress(Math.min(99, Math.round(got / total * 100)))
    }
    const buf = Buffer.concat(chunks.map(c => Buffer.from(c)))
    if(sha512(buf) !==String(item.sha512).toLowerCase()) throw new Error('O arquivo baixado não confere com o aprovado pela staff (sha512).')

    const dir = modsDir(serverId)
    fs.ensureDirSync(dir)
    const man = readManifest(serverId)
    const old = man[item.id]
    const dest = path.join(dir, path.basename(item.file))
    const tmp = dest + '.part'
    fs.writeFileSync(tmp, buf)
    fs.renameSync(tmp, dest)
    if(old && old.file !== path.basename(item.file)) fs.removeSync(path.join(dir, old.file))
    man[item.id] = { file: path.basename(item.file), version: item.version }
    writeManifest(serverId, man)
    onProgress(100)
    logger.info(`Instalado ${item.id} (${item.version}) em ${serverId}.`)
}

function uninstall(serverId, id) {
    const man = readManifest(serverId)
    const rec = man[id]
    if(rec) {
        fs.removeSync(path.join(modsDir(serverId), rec.file))
        fs.removeSync(path.join(modsDir(serverId), rec.file + '.disabled'))
    }
    delete man[id]
    writeManifest(serverId, man)
    logger.info(`Removido ${id} de ${serverId}.`)
}

/** Atualiza o que a staff trocou de versão e tira o que saiu do catálogo. */
async function syncInstalled(rawDistro, serverId) {
    const man = readManifest(serverId)
    const catalog = new Map(catalogFor(rawDistro, serverId).map(i => [i.id, i]))
    const changes = []
    for(const id of Object.keys(man)) {
        const item = catalog.get(id)
        if(!item) { uninstall(serverId, id); changes.push({ id, action: 'removed' }); continue }
        if(man[id].version !== item.version) { await install(serverId, item); changes.push({ id, action: 'updated', name: item.name }) }
    }
    return changes
}

/** modId e nome de um jar (neoforge.mods.toml, mods.toml ou fabric.mod.json). */
function readModMeta(file) {
    const meta = { modId: null, name: null }
    try {
        const zip = new AdmZip(file)
        const toml = zip.getEntry('META-INF/neoforge.mods.toml') || zip.getEntry('META-INF/mods.toml')
        if(toml) {
            const text = toml.getData().toString('utf8')
            const block = text.split(/\[\[\s*mods\s*\]\]/)[1] || text
            const pick = k => (block.match(new RegExp(`^\\s*${k}\\s*=\\s*["']([^"']+)["']`, 'm')) || [])[1] || null
            meta.modId = pick('modId')
            meta.name = pick('displayName')
        }
        const fabric = zip.getEntry('fabric.mod.json')
        if(!meta.modId && fabric) {
            const fj = JSON.parse(fabric.getData().toString('utf8').replace(/^\uFEFF/, ''))
            meta.modId = fj.id || null
            meta.name = fj.name || null
        }
    } catch { /* jar ilegível: fica só com o nome do arquivo */ }
    return meta
}

/**
 * Mods ativos na pasta mods/ (e mods/<versão do MC>/) que não vieram do distro.
 * @returns {{file: string, rel: string, modId: string|null, name: string|null, source: 'bancada'|'player'}[]}
 */
function scanPlayerMods(serverId, mcVersion) {
    const dir = modsDir(serverId)
    const fromConnector = new Set(readJson(path.join(gameDir(serverId), '.rootclient', 'connector-mods.json'), []).map(n => path.basename(n)))
    const fromBancada = new Set(Object.values(readManifest(serverId)).map(r => r.file))
    const out = []
    for(const sub of mcVersion ? ['', mcVersion] : ['']) {
        const d = path.join(dir, sub)
        if(!fs.existsSync(d) || !fs.statSync(d).isDirectory()) continue
        for(const name of fs.readdirSync(d)) {
            if(!MOD_FILE.test(name) || (!sub && fromConnector.has(name))) continue
            const file = path.join(d, name)
            if(!fs.statSync(file).isFile()) continue
            out.push({ file, rel: path.join(sub, name), ...readModMeta(file), source: !sub && fromBancada.has(name) ? 'bancada' : 'player' })
        }
    }
    return out
}

function patternTest(pattern, text) {
    try { return new RegExp(pattern, 'i').test(text) } catch { return false }
}

function matchBlocked(mod, blocked) {
    const id = (mod.modId || '').toLowerCase()
    const fname = path.basename(mod.file).toLowerCase()
    return blocked.find(r =>
        (r.modId && id && String(r.modId).toLowerCase() === id) ||
        (r.pattern && patternTest(r.pattern, fname))
    ) || null
}

/** Mods proibidos ativos nesta versão. */
function findBlocked(rawDistro, serverId, mcVersion) {
    const { blocked } = config(rawDistro)
    if(!blocked.length) return []
    return scanPlayerMods(serverId, mcVersion)
        .filter(m => m.source === 'player')
        .map(m => ({ ...m, rule: matchBlocked(m, blocked) }))
        .filter(m => m.rule)
}

/** Desativa sem apagar: o jogador decide o que fazer com o arquivo. */
function disable(file) {
    fs.renameSync(file, file + '.disabled')
    logger.warn('Mod proibido desativado:', path.basename(file))
}

module.exports = { config, catalogState, install, uninstall, syncInstalled, scanPlayerMods, findBlocked, matchBlocked, disable, modsDir }
