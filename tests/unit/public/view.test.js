import {beforeEach,describe,test,jest,expect} from '@jest/globals'
import {JSDOM} from 'jsdom'

import {View} from '../../../public/controller/js/view.js'

describe('#View - test suite for presentation layer', () => {
    const dom=new JSDOM()
    global.document=dom.window.document
    global.window=dom.window

    function createBtn({
        text,
        classList
    }={
        text:'',
        classList:{
            add:jest.fn(),
            remove:jest.fn()
        }
    }){
        return{
            innerText:text,
            onclick:jest.fn(),
            classList:classList
        }
    }

    beforeEach(()=>{
        jest.resetAllMocks()
        jest.clearAllMocks()
        jest.spyOn(
            document,
            "getElementById"
          ).mockReturnValue(createBtn())
    })  
    test('#changeCmdBtnsVisibility - given hide=true it should add unassigned class and reset onclick', () => {
        const view=new View()
        const btn=createBtn()

        //Ao chamar document.querySelectorAll irá retornar um array com um objeto mock de btn
        jest.spyOn(
            document,
            'querySelectorAll'
        ).mockReturnValue([btn])

        view.changeCmdBtnsVisibility()

        expect(btn.classList.add).toBeCalledWith('unassigned')
        expect(btn.onclick.name).toStrictEqual('onBtnClickReset')
        expect(()=>btn.onclick()).not.toThrow()
    });
    test('#changeCmdBtnsVisibility - given hide=false it should remove unassigned class and reset onclick', () => {
        const view=new View()
        const btn=createBtn()
        //Ao chamar document.querySelectorAll irá retornar um array com um objeto mock de btn
        jest.spyOn(
            document,
            'querySelectorAll'
        ).mockReturnValue([btn])

        view.changeCmdBtnsVisibility(false)

        expect(btn.classList.add).not.toHaveBeenCalled()
        expect(btn.classList.remove).toBeCalledWith('unassigned')
        expect(btn.onclick.name).toStrictEqual('onBtnClickReset')
        expect(()=>btn.onclick()).not.toThrow()
    });
    test('#onLoad', () => {
        const view=new View()

        jest.spyOn(
            view,
            view.changeCmdBtnsVisibility.name
        ).mockReturnValue()

        view.onLoad()

        expect(view.changeCmdBtnsVisibility).toHaveBeenCalled()
    });
});