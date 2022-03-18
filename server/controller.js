import { Service } from "./service.js";

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
}