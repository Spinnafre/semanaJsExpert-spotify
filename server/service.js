import fsPromises from 'fs/promises'
import fs from 'fs'
import { join, extname } from 'path'
import config from './config.js'

//Irá ser o controlador de taxas limites de bites
// que irão ser trafegados no stream
import Throttle from 'throttle'
import ChildProcess from 'child_process'
import { randomUUID } from 'crypto'
import { PassThrough, Writable } from 'stream'
import {
    once
} from 'events'
import streamsPromises from 'stream/promises'
import { logger } from './util.js'

const {
    dirs: {
        publicDir
    },
    constants: {
        fallbackBitRate,
        englishConversation,
        bitRateDivisor
    }
} = config
export class Service {
    constructor() {
        this.clientStreams = new Map()
        this.currentSongPath = englishConversation // path da som atual
        this.currentBitRate = 0
        this.throttleTransform = {}
        this.currentReadable = {}
    }
    createClientStream() {
        const id = randomUUID()
        const clientStream = new PassThrough()
        this.clientStreams.set(id, clientStream)

        return {
            id,
            clientStream
        }
    }

    removeClientStream(id) {
        this.clientStreams.delete(id)
    }
    // Executar comandos da lib sox 
    _executeSoxCommand(args) {
        return ChildProcess.spawn('sox', args)
    }

    async getBitRate(song) {
        try {
            const args = [
                '--i',// info
                '-B',// média de bit (bitrate)
                song
            ]

            const {
                //Erro na execução do comando na geração da saída
                stderr, // myProcess.stderr.on('data',...)
                // resultado do comando
                stdout // myProcess.stdout.on('data',...)
            } = this._executeSoxCommand(args)

            // stderr.once('readable',()=>)
            // stdout.once('readable',()=>)
            //Vai esperar primeiro ouvir pelo menos uma vez o evento 'readable' de cada stream
            await Promise.all(once(stderr, 'readable'), once(stdout, 'readable'))

            // Uma vez que esperou ler os eventos de readable (once(stream,'readable')), 
            // irá pegar os dados deles
            const [success, error] = [stdout, stderr].map(stream => stream.read())

            if (error) return await Promise.reject(error)
            return success
                .toString() //Converte buffer em string
                .trim()
                .replace(/k/, '000') // substitui (numero)K por (numero)000

        } catch (error) {
            logger.error(`Problema no bitrate: ${error}`)
            return fallbackBitRate
        }
    }

    broadcast(){
        return new Writable({
            write:(chunk,enc,cb)=>{
                for(const [id,stream] of this.clientStreams){
                    //Se o client desconectou então não deve ser enviado dados para ele
                    if(stream.writableEnded){
                        this.clientStreams.delete(id)
                        continue
                    }
                    //Registra no stream do cliente o chunk do áudio
                    stream.write(chunk)
                }
                cb()
            }
        })
    }

    async startStreaming() {
        logger.info(`starting with ${this.currentSongPath}`)
        const bitRate = this.currentBitRate = await this.getBitRate(this.currentSongPath) / bitRateDivisor
        const throttleTransform = this.throttleTransform = new Throttle(bitRate)
        const songReadable = this.currentReadable = this.createReadableStream(this.currentSongPath)
        //Pega chunks do áudio e passa para a stream do cliente caso ele esteja podendo receber
        return streamsPromises.pipeline(
            songReadable, // Audio do som Readable
            throttleTransform, // Controlar quantos bit rates irá ser passado
            this.broadcast() // Mandar para os clientes a cada chunk
        )
    }

    stopStreaming(){
        if(this.throttleTransform){
            if(this.throttleTransform.end){
                this.throttleTransform.end()
            }
        }
    }

    //criar o READABLE stream
    createReadableStream(path) {
        return fs.createReadStream(path)
    }
    /**
     * @param {string} file 
     */
    async getFileInfo(file) {
        const filePath = join(publicDir, file)//path completo do arquivo
        //Verifica se é possível achar e acessar o arquivo com o path
        // caso der error irá lançar o erro
        await fsPromises.access(filePath)
        const fileExtension = extname(filePath)
        return {
            type: fileExtension,
            path: filePath
        }
    }
    /**
     * Arquivo que irá passar 'path/index.html' e irá tentar achar ele
     * para caso achar irá criar a readable stream 
     * @param {string} file 
     * @returns {object} 
     */
    async getFileStream(file) {
        const {
            type,
            path
        } = await this.getFileInfo(file)
        return {
            readableStream: this.createReadableStream(path),
            type
        }
    }
}