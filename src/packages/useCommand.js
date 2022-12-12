import deepcopy from "deepcopy"
import { onUnmounted } from "vue"
import { events } from "./events"

export function useCommand(data,focusData){
  const state = {
    current: -1, //前进后退的索引值
    queue:[], //存放所有操作命令
    commands:{}, //命令与执行功能的映射表
    commandArray:[], //存放所有命令
    destroyArray:[]
  }

  const registry = (command) =>{
    state.commandArray.push(command)
    state.commands[command.name] = (...args)=>{
      const {redo,undo} = command.execute(...args)
      redo()
      if (!command.pushQueue){
        return
      }
      if (state.queue.length>0){
        state.queue = state.queue.slice(0,state.current+1)
      }
      state.queue.push({redo,undo})
      state.current = state.current+1
      console.log(state.queue);
    }
  }

  // 注册需要的命令 需要下一步
  registry({
    name:'redo',
    keyboard:'ctrl+y',
    execute(){
      return{
        redo(){
          let item = state.queue[state.current+1]
          if (item) {
            item.redo&&item.redo()
            state.current++
          }
        }
      }
    }
  })
  // 需要上一步
  registry({
    name:'undo',
    keyboard:'ctrl+z',
    execute(){
      return{
        redo(){
          if (state.current == -1) return
          let item = state.queue[state.current]
          if (item){
            item.undo&&item.undo()
            state.current--
          }
        }
      }
    }
  })
  registry({
    name:'drag',
    pushQueue:true,
    init(){
      this.before = null
      // 监控拖拽开始事件，保存状态
      const start = ()=>this.before = deepcopy(data.value.blocks)
      // 拖拽之后需要触发的指令
      const end = ()=>state.commands.drag()
      events.on('start',start)
      events.on('end',end)
      return()=>{
        events.off('start',start)
        events.off('end',end)
      }
    },
    execute(){
      let before = this.before
      let after = data.value.blocks
      return{
        redo(){ //需要下一步
          data.value = {...data.value,blocks:after}
        },
        undo(){ //需要上一步
          data.value = {...data.value,blocks:before}
        }
      }
    }
  });

  registry({
    name:'updateContainer',
    pushQueue:true,
    
    execute(newValue){
      let state = {
        before:data.value,
        after:newValue
      }
      return{
        redo(){ //需要下一步
          data.value = state.after
        },
        undo(){ //需要上一步
          data.value = state.before
        }
      }
    }
  });

  registry({
    name:'placeTop', //置顶操作
    pushQueue:true,
    execute(){
      let before = deepcopy(data.value.blocks)
      let after = (()=>{
        let {focus,unfocus} = focusData.value
        let maxZIndex = unfocus.reduce((prev,block)=>{
          return Math.max(prev,block.zIndex)
        },-Infinity);

        focus.forEach(block=>block.zIndex = maxZIndex+1)
        return data.value.blocks
      })();
      return{
        redo(){ //需要下一步
          data.value = {...data.value,blocks:after}
        },
        undo(){ //需要上一步
          data.value = {...data.value,blocks:before}
        }
      }
    }
  });

  registry({
    name:'placeBottom', // 置底操作
    pushQueue:true,
    execute(){
      let before = deepcopy(data.value.blocks)
      let after = (()=>{
        let {focus,unfocus} = focusData.value
        let minZIndex = unfocus.reduce((prev,block)=>{
          return Math.min(prev,block.zIndex)
        },Infinity)-1;

        if(minZIndex<0){
          const dur = Math.abs(minZIndex)
          minZIndex = 0
          unfocus.forEach(block=>block.zIndex+=dur)
        }
        focus.forEach(block=>block.zIndex = minZIndex)
        return data.value.blocks
      })();

      return{
        redo(){ //需要下一步
          data.value = {...data.value,blocks:after}
        },
        undo(){ //需要上一步
          data.value = {...data.value,blocks:before}
        }
      }
    }
  });

  registry({ 
    name:'delete', // 删除操作
    pushQueue:true,
    execute(){
      let state = {
        before:deepcopy(data.value.blocks),
        after:focusData.value.unfocus
      }

      return{
        redo(){ //需要下一步
          data.value = {...data.value,blocks:state.after}
        },
        undo(){ //需要上一步
          data.value = {...data.value,blocks:state.before}
        }
      }
    }
  });


  registry({
    name:'updateBlock',
    pushQueue:true,
    
    execute(newBlock,oldBlock){
      let state = {
        before:data.value.blocks,
        after:(()=>{
          let blocks = [...data.value.blocks]
          const index = data.value.blocks.indexOf(oldBlock)
          if (index>-1) {
            blocks.splice(index,1,newBlock)
          }
          return blocks
        })()
      }
      return{
        redo(){ //需要下一步
          data.value = {...data.value,blocks:state.after}
        },
        undo(){ //需要上一步
          data.value = {...data.value,blocks:state.before}
        }
      }
    }
  });


  const keyboardEvent = (()=>{
    const keyCodes = {
      90:'z',
      89:'y'
    }
    const onKeydown = (e) =>{
      const {ctrlKey,keyCode} = e
      let keyString = []
      if (ctrlKey) keyString.push('ctrl')
      keyString.push(keyCodes[keyCode])
      keyString = keyString.join('+')
      console.log(keyString);

      state.commandArray.forEach(({keyboard,name})=>{
        if (!keyboard) return
        if (keyboard === keyString) {
          state.commands[name]();
          e.preventDefault();
        }
      })

    }
    const init = () =>{
      window.addEventListener('keydown',onKeydown)
      return()=>{
        window.removeEventListener('keydown',onKeydown)
      }
    }
    return init
  })();

  (()=>{
    state.destroyArray.push(keyboardEvent())
    state.commandArray.forEach(command=>command.init&&state.destroyArray.push(command.init()))
  })();
  onUnmounted(()=>{
    state.destroyArray.forEach(fn=>fn&&fn())
  })
  return state
}