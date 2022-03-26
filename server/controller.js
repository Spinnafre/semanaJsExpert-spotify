import { Service } from "./service.js";
import { logger } from "./util.js";

export class Controller{
    constructor(){
        this.service=new Service()
    }
    /**
     * Nome do arquivo - file.xx
     * @param {string} filename 
     * @returns {object}
     */
    async getFileStream(filename){
        return this.service.getFileStream(filename)
    }
    //Onde o cliente irá passar os comandos para o servidor
    async handleCommand({command}){
        logger.info(`command received: ${command}`)
        const resp={
            response:'ok'
        }

        const cmd=command.toLowerCase()
        if(cmd.includes('start')){
            this.service.startStreaming()
            return resp
        }
        if(cmd.includes('stop')){
            this.service.stopStreaming()
            return resp
        }

        const fxFilePath=await this.service.readFxByName(cmd)
        logger.info(`added fx to service:${fxFilePath}`)
        this.service.appendFxStream(fxFilePath)
        return resp
    }
    //Criar o id do cliente e também a stream que irá receber os áudios
    createClientStream(){
        const {
            id,
            clientStream
        }=this.service.createClientStream()

        const onCloseConnection=()=>{
            logger.info(`Closing connection of ${id}`)
            this.service.removeClientStream(id)
        }

        return{
            stream:clientStream,
            onCloseConnection
        }
    }
}