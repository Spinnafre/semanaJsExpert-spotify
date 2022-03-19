import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config.js'

import { Controller } from '../../../server/controller.js'
import { handler } from '../../../server/routes.js'
import { TestUtil } from '../_util/testUtil.js' //Mock de Request e Response

const {
    location,
    pages: {
        homeHTML,
        controllerHTML
    },
    constants: {
        CONTENT_TYPE
    }
} = config


describe('#Routes - test site for api response', function () {
    beforeEach(() => {
        // Como na função testUtil.js estou criando uma função usando o jest.fn()
        // e no decorrer desse testes elas irão serem chamadas
        //para fazer a função que foi criado usado fn() voltar ao estado original 
        // é necessário usar o resetAllMocks
        jest.restoreAllMocks()
        jest.clearAllMocks()
    })
    test('GET / - should redirect to home page', async () => {
        //Irá gerar mock de REQ e RES do http   
        const mockHttp = TestUtil.defaultHandleParams()
        mockHttp.request.method = 'GET'
        mockHttp.request.url = '/'

        await handler(...mockHttp.values())

        expect(mockHttp.response.writeHead).toBeCalledWith(302, {
            'Location': location.home
        })
        expect(mockHttp.response.end).toHaveBeenCalled()
    })
    test(`GET /home - should response with ${homeHTML} file stream`, async () => {
        const mockHttp = TestUtil.defaultHandleParams()
        mockHttp.request.method = 'GET'
        mockHttp.request.url = '/home'
        const mockReadableStreamFile = TestUtil.generateReadableStream(['testando'])

        //.name serve para pegar o nome da função chamada em string
        // jest.spyOn(Controller.prototype,Controller.prototype.getFileStream.name)
        jest.spyOn(Controller.prototype, 'getFileStream')
            .mockResolvedValue({
                readableStream: mockReadableStreamFile
            })

        //Quando chamar stream.pipe() irá retornar uma valor vazio
        jest.spyOn(mockReadableStreamFile, 'pipe')
            .mockReturnValue()

        await handler(...mockHttp.values())

        expect(mockReadableStreamFile.pipe).toHaveBeenCalled()
        expect(Controller.prototype.getFileStream).toBeCalledWith(homeHTML)
    })
    test(`GET /controller - should response with ${controllerHTML} file stream`, async () => {
        const mockHttp = TestUtil.defaultHandleParams()
        mockHttp.request.method = 'GET'
        mockHttp.request.url = '/controller'
        const mockReadableStreamControllerHTML = TestUtil.generateReadableStream(['testando com controller'])

        jest.spyOn(Controller.prototype, 'getFileStream')
            .mockResolvedValue({
                readableStream: mockReadableStreamControllerHTML
            })

        jest.spyOn(mockReadableStreamControllerHTML, 'pipe')
            .mockReturnValue()

        await handler(...mockHttp.values())

        expect(mockReadableStreamControllerHTML.pipe).toHaveBeenCalled()
        expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(controllerHTML)
    })
    test('GET /index.html - should response with file stream', async () => {
        const mockHttp = TestUtil.defaultHandleParams()
        const filename = '/index.html'
        mockHttp.request.method = 'GET'
        mockHttp.request.url = filename
        const mockReadableFile = TestUtil.generateReadableStream(['TEST'])
        const expectedTypeFile = '.html'

        jest.spyOn(Controller.prototype, 'getFileStream')
            .mockResolvedValue({
                readableStream: mockReadableFile,
                type: expectedTypeFile
            })

        jest.spyOn(mockReadableFile, 'pipe')
            .mockReturnValue()

        await handler(...mockHttp.values())

        expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
        expect(mockReadableFile.pipe).toHaveBeenCalled()
        expect(mockHttp.response.writeHead).toHaveBeenCalledWith(200, {
            'Content-Type': CONTENT_TYPE[expectedTypeFile]
        })
    })
    test('GET /file.ext - should response with file stream', async () => {
        const mockHttp = TestUtil.defaultHandleParams()
        const filename = '/file.ext'
        const expectedTypeFile = '.ext'
        mockHttp.request.method = 'GET'
        mockHttp.request.url = filename
        const mockReadableFile = TestUtil.generateReadableStream(['TEST'])

        jest.spyOn(Controller.prototype, 'getFileStream')
            .mockResolvedValue({
                readableStream: mockReadableFile,
                type: expectedTypeFile
            })

        jest.spyOn(mockReadableFile, 'pipe')
            .mockReturnValue()

        await handler(...mockHttp.values())

        expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
        expect(mockReadableFile.pipe).toHaveBeenCalled()
        expect(mockHttp.response.writeHead).not.toHaveBeenCalled()

    })
    test('POST /unknown - given an inexistent route it should response with 404', async () => {
        const mockHttp = TestUtil.defaultHandleParams()
        mockHttp.request.method = 'POST'

        await handler(...mockHttp.values())

        expect(mockHttp.response.writeHead).toHaveBeenCalledWith(404)
        expect(mockHttp.response.end).toHaveBeenCalled()
    })
    describe('exceptions', () => {
        test('given inexistent file it should respond with 404', async() => {
            const mockHttp = TestUtil.defaultHandleParams()
            mockHttp.request.method = 'GET'
            mockHttp.request.url="/index.php"

            jest.spyOn(Controller.prototype, 'getFileStream')
                .mockRejectedValue(new Error('Error: ENOENT: no such file or directy'))

            await handler(...mockHttp.values())

            expect(mockHttp.response.writeHead).toHaveBeenCalledWith(404)
            expect(mockHttp.response.end).toHaveBeenCalled()
        })
        test('given an error it should respond with 500', async() => {
            const mockHttp = TestUtil.defaultHandleParams()
            mockHttp.request.method = 'GET'
            mockHttp.request.url="/index.php"

            jest.spyOn(Controller.prototype, 'getFileStream')
                .mockRejectedValue(new Error('Error:'))

            await handler(...mockHttp.values())

            expect(mockHttp.response.writeHead).toHaveBeenCalledWith(500)
            expect(mockHttp.response.end).toHaveBeenCalled()
        })
    })
});