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
        publicDir,
        fxDir
    },
    constants: {
        fallbackBitRate,
        englishConversation,
        bitRateDivisor,
        fxVolume,
        audioMediaType,
        songVolume
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
        console.log('song => ', song)
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
            await Promise.all([
                once(stderr, 'readable'),
                once(stdout, 'readable'),
            ])

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

    broadcast() {
        return new Writable({
            write: (chunk, enc, cb) => {
                for (const [id, stream] of this.clientStreams) {
                    //Se o client desconectou então não deve ser enviado dados para ele
                    if (stream.writableEnded) {
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
    stopStreaming() {
        if (this.throttleTransform) {
            if (this.throttleTransform.end) {
                //Para de transformar a readable stream
                // em writable stream, ou seja, irá parar a transmissão.
                this.throttleTransform.end()
            }
        }
    }

    async readFxByName(fxName) {
        const allSongs = await fsPromises.readdir(fxDir)
        //Se o oome do efeito está presente no diretório de fx
        const chooseFile = allSongs.find(filename => filename.toLowerCase().includes(fxName))
        if (!chooseFile) {
            return Promise.reject(`the song ${fxName} wasn't found!`)
        }
        return join(fxDir, chooseFile)
    }
    appendFxStream(fxFilePath) {
        const throttleTransformable = new Throttle(this.currentBitRate)

        //Vai adicionar um transform vazia, mas quando for recebendo dados
        // irá passar para os clientes 
        streamsPromises
            .pipeline(
                throttleTransformable,
                this.broadcast()
            )

        const unpipe = () => {
            const streamWithFx = this.mergeAudioStreams(fxFilePath, this.currentReadable)
            this.throttleTransform = throttleTransformable
            this.currentReadable = streamWithFx

            //Remover o listener para evitar vazamento de memória
            this.throttleTransform.removeListener('unpipe', unpipe)

            //A media em que for lendo a stream com novo áudio com fx
            // vai passando para a 'throttleTransformable' e em seguida irá
            // cair no primeiro pipeline passando assim para o this.broadcast()
            streamsPromises
                .pipeline(
                    streamWithFx,
                    throttleTransformable
                )
        }

        //Irá pausar o controle de fluxo de dados
        this.throttleTransform.pause()
        //Fica observando se o 'throttleTransform' foi removido da stream
        this.throttleTransform.on('unpipe', unpipe)
        //Remove o 'throttleTransform' de 'currentReadable'
        this.currentReadable.unpipe(this.throttleTransform)
    }
    mergeAudioStreams(fxFilePath, readable) {
        //Passar input de dados diretamente para o output 
        const transformStream = PassThrough()

        const soxCommand = [
            '-t', audioMediaType, //Tipo de áudio passado pelo stdin (entrada)
            '-v', songVolume, // Volume do áudio passado pelo stdin (entrada)
            '-m', '-',//'-m' => merge, '-' => receber como stdin
            '-t', audioMediaType, //Tipo de audio do segundo arquivo
            '-v', fxVolume, // Volume do segundo arquivo
            fxFilePath,
            '-t', audioMediaType, //Tipo de áudio da saída (stdout)
            '-' //Saída em formato stream (stdout)
        ]

        const { stdin, stdout } = this._executeSoxCommand(soxCommand)

        //Passa dados da 'readable' como entrada para o 'stdin'
        // que irá ser a entrada para o comando do terminal, fazendo assim
        // com que o sox leia a stream com entrada e misture com o fx
        streamsPromises
            .pipeline(
                readable,
                stdin
            )

        //Pega a saída do sox command (stream) e manda para 
        // o transform
        streamsPromises
            .pipeline(
                stdout,
                transformStream
            )

        return transformStream

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