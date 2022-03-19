import {Readable,Writable} from 'stream'
import {jest} from '@jest/globals'

export class TestUtil{
    // Request - ReadableStream
    static generateReadableStream(data){
        return new Readable({
            read(){
                for(let value of data){
                    this.push(value) // Vai gerar os chunks do readable
                }

                this.push(null) // Usado para sinalizar que acabou a geração de readable
            }
        })
    }
    //Response - WritableStream
    static generateWritableStream(onData){
        return new Writable({
            write(chunk,encoding,callback){
                onData(chunk)
                callback(null,chunk)
            }
        })
    }
    // Criar mock do request e response
    static defaultHandleParams(){
        const requestStream=TestUtil.generateReadableStream([1,2,3,4,5,6,7,8,9,10])
        const responseStream=TestUtil.generateWritableStream(()=>{})

        const mock={
            request:Object.assign(requestStream,{
                headers:{},
                body:{},
                method:'',
                url:''
            }),
            //Usar o jest.fn() é muito útil para criar mock de funções
            // que quando chamada posso facilmente observar o que foi passado nela
            // (argumentos...) além de saber quantas vezes foi chamada, se foi chamada...
            response:Object.assign(responseStream,{
                writeHead:jest.fn(),
                end:jest.fn()
            })
        }
        return{
            values:()=>Object.values(mock),
            ...mock
        }
    }
}
