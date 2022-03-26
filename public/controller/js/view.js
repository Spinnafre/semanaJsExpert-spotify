export class View{
    constructor(){
        this.btnStart=document.getElementById('start')
        this.btnStop=document.getElementById('stop')

        this.buttons=()=>Array.from(document.querySelectorAll('button'))
        //Quais botões irão serem ignorados
        this.ignoredBtns=new Set(['unassigned'])
        //Função padrão do botão
        async function onBtnClick(){}
        this.onBtnClickMakeRequest=onBtnClick

        this.DISABLE_BTN_TIMEOUT=500
    }
    // Carregar o componente (no browser)
    onLoad(){
        this.changeCmdBtnsVisibility()
        //Adiciona a função de iniciar no botão de start
        //Muda o contexto de onStartClicked para referenciar ao objeto btnStart
        this.btnStart.onclick=this.onStartClicked.bind(this)
    }
    //Alterar a visibilidade dos botões de comandos
    changeCmdBtnsVisibility(hide=true){
        Array.from(document.querySelectorAll('[name=command]'))
        .forEach(btn=>{
            const action=hide?'add':'remove'
            btn.classList[action]('unassigned')
            //resetar a função atrelada ao botão
            function onBtnClickReset(){}
            btn.onclick=onBtnClickReset
        })
    }
    async onCommandClick(btn){
        const{
            srcElement:{
                innerText,
                classList
            }
        }=btn
        //Adicionar efeito de selecionar o BTN
        this.toggleDisableCmdBtn(classList)
        //Envia o comando do FX
        await this.onBtnClickMakeRequest(innerText)
        //Delay para depois remover a seleção do botão
        setTimeout(()=>this.toggleDisableCmdBtn(classList),this.DISABLE_BTN_TIMEOUT)
    }
    async onStartClicked({
        srcElement:{
            innerText
        }
    }){
        const btnText=innerText
        //Enviar comando START para o servidor
        await this.onBtnClickMakeRequest(btnText)
        //Exibir botão de stop e oculta o de start
        this.toggleBtnStartStream()
        //Exibir botões de fx
        this.changeCmdBtnsVisibility(false)

        //Adicionar funções nos botões de fx e stop
        this.buttons()
            // Filtrar por botões que não sejam 'unassigned'
            .filter(btn=>this.notIsUnassignedBtn(btn))
            //Adicionar funcionalidades nos botões
            .forEach(this.setupBtnAction.bind(this))
        
    }
    onStopBtn({
        srcElement:{
            innerText
        }
    }){
        //Exibe o botão de start
        this.toggleBtnStartStream(false)
        //Oculta os outros botões de fx
        this.changeCmdBtnsVisibility(true)
        //Manda o comando para parar (STOP) a stream
        return this.onBtnClickMakeRequest(innerText)
    }
    // Verificar se não é 'unassigned'
    notIsUnassignedBtn(btn){
        const classes=Array.from(btn.classList)
        const haveUnassignedClass=classes.some(className=>this.ignoredBtns.has(className))
        //Se encontrar o item com 'unassigned' então irá retornar false para no filter
        // ignorar o item
        return !haveUnassignedClass
    }
    //Adicionar função de enviar o comando para API
    configureOnBtnClick(fn){
        this.onBtnClickMakeRequest=fn
    }
    //Adicionar funcionalidades nos botões
    setupBtnAction(btn){
        const cmdBtn=btn.innerText.toLowerCase()
        //btnStart já tem uma função atrelada a ele
        if(cmdBtn.includes('start')){
            return
        }
        // Se for o botão de parar (stop) adiciona o comando
        if(cmdBtn.includes('stop')){
            btn.onclick=this.onStopBtn.bind(this)
            return
        }
        //Adiciona funções para os botões de FX
        btn.onclick=this.onCommandClick.bind(this)
    }
    //Quando clicar no botão de FX irá adicionar ou remover efeito de seleção
    toggleDisableCmdBtn(classList){
        //Se já está selecionado
        if(classList.contains('active')){
            classList.remove('active')
            return
        }
        classList.add('active')

    }
    toggleBtnStartStream(active=true){
        if(active){
            //Quando clicar em start irá esconder o botão start
            this.btnStart.classList.add('hidden')
            this.btnStop.classList.remove('hidden')
            return
        }
        this.btnStop.classList.add('hidden')
        this.btnStart.classList.remove('hidden')

    }

}