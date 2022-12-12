import { computed, ref } from "vue"
export function useFocus (data,previewRef,callback){
  const selectIndex = ref(-1)

  //最后选择的那一个
  const lastSelectBlock = computed(()=>data.value.blocks[selectIndex.value])

  const focusData = computed(() => {
    let focus = []
    let unfocus = []
    data.value.blocks.forEach(block => (block.focus ? focus : unfocus).push(block))
    return {
      focus,
      unfocus
    }
  })
  const clearBlockFocus = () => {
    data.value.blocks.forEach(block => block.focus = false)
  }
  //点击容器让所有失去焦点
  const containerMousedown = () => {
    if (previewRef.value) return
    clearBlockFocus()
    selectIndex.value = -1
  }
  const blockMousedown = (e, block,index) => {
    if (previewRef.value) return
    e.preventDefault();
    e.stopPropagation();
    // block上规划一个属性 focus获取焦点后就将focus变为true
    if (e.shiftKey) {
      if (focusData.value.focus.length <=1){
        block.focus = true
      }else {
        block.focus = !block.focus
      }
    } else {
      if (!block.focus) {
        clearBlockFocus() //清空其他人的属性
        block.focus = true
      } //当自己已经被选中了，再次点击还是选中的状态
    }
    selectIndex.value = index
    callback(e)
  }
  
  return{
    blockMousedown,
    focusData,
    containerMousedown,
    lastSelectBlock,
    clearBlockFocus
  }
}