import fsPromises from 'fs/promises'
import fs from 'fs'
import { join,extname } from 'path'
import config from './config.js'

const {
    dirs: {
        publicDir
    }
} = config
export class Service {
    //criar o READABLE stream
    createReadableStream(path) {
        return fs.createReadStream(path)
    }
    /**
     * @param {string} file 
     */
    async getFileInfo(file) {
        const filePath = join(publicDir,file)//path completo do arquivo
        //Verifica se é possível achar e acessar o arquivo com o path
        // caso der error irá lançar o erro
        await fsPromises.access(filePath)
        const fileExtension=extname(filePath)
        return{
            type:fileExtension,
            path:filePath
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
        return{
            readableStream:this.createReadableStream(path),
            type
        }
    }
}