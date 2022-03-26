import {
    jest,
    expect,
    describe,
    test,
    beforeEach
} from '@jest/globals'

import supertest from 'supertest'
//Encontrar portas
import portfinder from 'portfinder'

import Server from '../../../server/server.js'

import {Transform} from 'stream'

import {setTimeout} from 'timers/promises'

const RETENTION_DATA_PERIOD = 200
describe('API E2E Suite Test', () => {
    const commandResponse = JSON.stringify({
        response: 'ok'
      })
      const possibleCommands = {
        start: 'start',
        stop: 'stop',
      }

      function pipeAndReadStreamData(stream,onChunk){
          const transform=new Transform({
              transform(chunk,enc,cb){
                  //Vai ser a função chamada para obter 
                  //    
                  onChunk(chunk)
                  cb(null,chunk)
              }
          })
          return stream.pipe(transform)
      }
    describe('client workflow',()=>{
        //Criar servidor a partir de uma porta existente
        async function getTestServer(){
            const getSupertest=port=>supertest(`http://localhost:${port}`)
            const port=await portfinder.getPortPromise()
            return new Promise((resolve,reject)=>{
                //Instancia o servidor
                const server=Server.listen(port)
                //Observa ele capturar o event de listening
                // Ou seja, o servidor estar rodando
                .once('listening',()=>{
                    const testServer=getSupertest(port)
                    const response={
                        testServer,
                        kill(){
                            server.close()
                        }
                    }
                    return resolve(response)
                })
                .once('error',reject)
            })
        }

        function commandSender(testServer){
            return{
                async send(command){
                    const response=await testServer.post('/controller')
                    .send({
                        command
                    })
                    expect(response.text).toStrictEqual(commandResponse)
                }
            }
        }
        // Quando o comando de começar o stream não for realizado
        test('it should not receive data stream if the process is not playing',async()=>{
            const server= await getTestServer()
            const onChunk=jest.fn() // Função mock

            pipeAndReadStreamData(
                server.testServer.get('/stream'),
                onChunk
            )
            
            await setTimeout(RETENTION_DATA_PERIOD)

            server.kill()

            expect(onChunk).not.toHaveBeenCalled()
        })
        test('it should receive data stream if the process is playing',async()=>{
            const server= await getTestServer()
            const onChunk=jest.fn() // Função mock

            const {send}=commandSender(server.testServer)

            pipeAndReadStreamData(
                server.testServer.get('/stream'),//Criar cliente e stream dele
                onChunk
            )

            await send(possibleCommands.start)
            await setTimeout(RETENTION_DATA_PERIOD)
            await send(possibleCommands.stop)

            const [
                [buffer]
            ]=onChunk.mock.calls

            expect(buffer).toBeInstanceOf(Buffer)
            expect(buffer.length).toBeGreaterThan(1000)

            server.kill()
        })

    })
});