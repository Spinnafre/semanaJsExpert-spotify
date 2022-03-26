import { logger } from "./util.js"
import { Controller } from './controller.js'
import config from './config.js'
import { once } from "events"


const {
    location: {
        home
    },
    pages: {
        homeHTML,
        controllerHTML
    },
    constants: {
        CONTENT_TYPE
    }
} = config

const controller = new Controller()
async function routes(req, res) {
    const { method, url } = req

    //http://localhost:3000/ irá redirecionar para http://localhost:3000/home
    if (method === 'GET' && url === '/') {
        res.writeHead(302, {
            'Location': home
        })
        return res.end()
    }
    if (method === 'GET' && url === '/stream') {
        const {
            stream,
            onCloseConnection
        } = controller.createClientStream()
        //Se for mandado algum evento 'close'  na requisição
        //Irá entender que terá que excluir o cliente
        req.once("close", onCloseConnection) 
        //Informar o tipo de header da response para aceitar
        // audio e em fluxos de bytes
        res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Accept-Rages': 'bytes'
        })

        return stream.pipe(res)
    }
    if (method === 'GET' && url === '/home') {
        const {
            readableStream
        } = await controller.getFileStream(homeHTML)

        // padrão do response é text/html
        // response.writeHead(200, {
        //   'Content-Type': 'text/html'
        // })
        //Passa o aquivo /home/index.html para o res
        //Ou seja, irá mandar o arquivo para ser renderizado quando solicitar
        //essa requisição
        return readableStream.pipe(res)
    }

    if (method === 'GET' && url === '/controller') {
        const { readableStream } = await controller.getFileStream(controllerHTML)
        return readableStream.pipe(res)
    }
    //Enviar comandos
    if (method === 'POST' && url === '/controller') {
        //Vai esperar ouvir o evento data de request
        const data=await once(req,'data')
        const item=JSON.parse(data)
        const result= await controller.handleCommand(item)
        return res.end(JSON.stringify(result))
    }

    //Buscar algum arquivo do servidor (http://localhost:3000/file)
    if (method === 'GET') {
        const {
            readableStream,
            type
        } = await controller.getFileStream(url)
        //Irá procurar se o tipo de arquivo está no CONTENT_TYPE
        const contentType = CONTENT_TYPE[type]
        if (contentType) {
            res.writeHead(200, {
                'Content-Type': contentType
            })
        }
        return readableStream.pipe(res)
    }

    //Se for qualquer outro MÉTODO irá dar problema
    res.writeHead(404)
    return res.end()
}
function handleErrors(err, response) {
    //Arquivo ou caminho não encontrado
    //Irá exibir o erro mas não irá parar a aplicação
    if (err.message.includes('ENOENT')) {
        logger.warn(`Asset not found ${err.stack}`)
        response.writeHead(404) // STATUS 404
        return response.end()
    }
    logger.error(`caught error on API ${err.stack}`)
    response.writeHead(500)
    return response.end()
}
async function handler(req, res) {
    //fica mais fácil de controlar erros
    return routes(req, res)
        .catch(err => handleErrors(err, res))
}

export {
    handler
}