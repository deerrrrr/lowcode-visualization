import { reactive } from "vue"
import { events } from "./events"

export function useBlockDragger(focusData,lastSelectBlock,data){
  let dragState = {
    startX: 0,
    startY: 0,
    dragging:false //默认不是正在拖拽
  }
  let markLine = reactive({
    x:null,
    y:null
  })
  const mousemove = (e) => {
    let { clientX: moveX, clientY: moveY } = e
    if (!dragState.dragging) {
      dragState.dragging = true
      events.emit('start')
    }

    //计算当前元素最新的left和top，在线里面找，显示线
    let left = moveX - dragState.startX + dragState.startLeft
    let top = moveY - dragState.startY + dragState.startTop

    // 计算横线，距离参照物还有5px时，显示线
    let y = null
    let x = null
    for (let i = 0;i< dragState.lines.y.length;i++){
      const {top:t,showTop:s} = dragState.lines.y[i]
      if (Math.abs(t-top)<5) {
        y=s //线要出现的位置
        moveY = dragState.startY - dragState.startTop+t //实现快速和这个元素贴在一起
        break
      }
    }
    for (let i = 0;i< dragState.lines.x.length;i++){
      const {left:l,showLeft:s} = dragState.lines.x[i]
      if (Math.abs(l-left)<5) {
        x=s //线要出现的位置
        moveX = dragState.startX - dragState.startLeft+l //实现快速和这个元素贴在一起
        break
      }
    }

    markLine.x = x
    markLine.y = y

    let durX = moveX - dragState.startX;
    let durY = moveY - dragState.startY;
    focusData.value.focus.forEach((block, idx) => {
      block.top = dragState.startPos[idx].top + durY
      block.left = dragState.startPos[idx].left + durX
    })

  }
  const mouseup = () => {
    document.removeEventListener('mousemove', mousemove)
    document.removeEventListener('mouseup', mouseup)
    markLine.x = null
    markLine.y = null
    if (dragState.dragging){
      events.emit('end')
    }
  }
  const mousedown = (e) => {
    const {width:BWidth,height:BHeight} = lastSelectBlock.value

    dragState = {
      startX: e.clientX,
      startY: e.clientY, //记录每一个选中的位置
      startLeft:lastSelectBlock.value.left,
      startTop:lastSelectBlock.value.top,
      dragging:false,
      startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
      lines:(()=>{
        const {unfocus} = focusData.value
        let lines = {x:[],y:[]}; //计算横线的位置用y 纵线用x
        [...unfocus,{
            top:0,
            left:0,
            width:data.value.container.width,
            height:data.value.container.height 
        }].forEach((block)=>{
          const {
            top:ATop,
            left:ALeft,
            width:AWidth,
            height:AHeight
          }=block
        //当此元素拖拽到和A元素top一致时，显示辅助线
          lines.y.push({showTop:ATop,top:ATop})
          lines.y.push({showTop:ATop,top:ATop-BHeight}) //顶对底
          lines.y.push({showTop:ATop+AHeight/2,top:ATop+AHeight/2-BHeight/2}) //中对中
          lines.y.push({showTop:ATop+AHeight,top:ATop+AHeight}) //底对顶
          lines.y.push({showTop:ATop+AHeight,top:ATop+AHeight-BHeight})//底对底
          
          lines.x.push({showLeft:ALeft,left:ALeft}) //左对左
          lines.x.push({showLeft:ALeft+AWidth,left:ALeft+AWidth}) //右对左
          lines.x.push({showLeft:ALeft+AWidth/2,left:ALeft+AWidth/2-BWidth/2}) //中对中
          lines.x.push({showLeft:ALeft+AWidth,left:ALeft+AWidth-BWidth}) //右对右
          lines.x.push({showLeft:ALeft,left:ALeft-BWidth}) //左对右
          
        })
        return lines
      })()
    }
    document.addEventListener('mousemove', mousemove)
    document.addEventListener('mouseup', mouseup)
  }
  return {
    mousedown,
    markLine
  }
}