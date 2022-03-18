import { join,dirname } from 'path'
import {fileURLToPath} from 'url'
//{url: 'file:///C:/Users/davis/Documents/PROJECTS/Js/jsExpert/semanajsexpert-spotify-template/server/config.js'}
const currentDir=dirname(fileURLToPath(import.meta.url))
const rootDir=join(currentDir,'../')
const audioDir=join(rootDir,'audio')
const publicDir=join(rootDir,'public')

//ARQUIVOS ESTÁTICOS
export default{
    port: process.env.PORT || 3000,
    dirs:{
        rootDir,
        audioDir,
        publicDir,
        songsDir:join(audioDir,'songs'),
        fxDir:join(audioDir,'fx')
    },
    pages:{
        homeHTML:'home/index.html',
        controllerHTML:'controller/index.html'
    },
    location:{
        home:'/home'
    },
    constants:{
        CONTENT_TYPE:{
            '.html':'text/html',
            '.css':'text/css',
            '.js':'text/javascript',
        }
    }
}