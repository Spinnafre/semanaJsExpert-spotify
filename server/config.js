import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
//FileURL=> {url: 'file:///C:/Users/davis/Documents/PROJECTS/Js/jsExpert/semanajsexpert-spotify-template/server/config.js'}
//Irá ser convertida para C:/Users/davis/Documents/PROJECTS/Js/jsExpert/semanajsexpert-spotify-template/server/config.js
// Como estou trabalhando com módulos (type:modules), usar o __dirname e __filename não irá funcionar
// para isso é só pegar o meta a url e ler a url do arquivo.
const currentDir = dirname(fileURLToPath(import.meta.url)) //x/x/server/
const rootDir = join(currentDir, '../')
const audioDir = join(rootDir, 'audio')
const publicDir = join(rootDir, 'public')
const songsDir = join(audioDir, 'songs')
//ARQUIVOS ESTÁTICOS
export default {
    port: process.env.PORT || 3000,
    dirs: {
        rootDir,
        audioDir,
        publicDir,
        songsDir,
        fxDir: join(audioDir, 'fx')
    },
    pages: {
        homeHTML: 'home/index.html',
        controllerHTML: 'controller/index.html'
    },
    location: {
        home: '/home'
    },
    constants: {
        CONTENT_TYPE: {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
        },
        audioMediaType: 'mp3',
        songVolume: '0.99',
        fxVolume:'0.1',
        fallbackBitRate: '128000',
        bitRateDivisor: 8,
        englishConversation: join(songsDir, 'conversation.mp3')
    }
}