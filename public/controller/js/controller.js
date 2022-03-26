//Vai ser o meio termo entre a View e o Service
export class Controller{
    constructor({view,service}){
        this.view=view
        this.service=service
    }
    /**
     * Injeção de depêndecia
     * @param {object} dependencies 
     */
    static initialize(dependencies){ //Controller.initialize({view,service})
        const controller=new Controller(dependencies)
        controller.onLoad()
        return controller
    }
    /**
     * Enviar comando para a API
     * @param {string} command 
     * @returns 
     */
    async sendCommand(command){
        return this.service.makeRequest({
            command:command.toLowerCase()
        })
    }

    onLoad(){
        //Envia a função do controller para a view e fixa o contexto 'this'
        // para ser sempre o 'this' do controller 
        this.view.configureOnBtnClick(this.sendCommand.bind(this))
        this.view.onLoad()
    }
}