import { createVNode, defineComponent, render, reactive, computed, onMounted, ref, onBeforeUnmount, provide, inject } from "vue";

export const DropdownItem = defineComponent({
  props: {
    label: String
  },
  setup(props) {
    let hide = inject('hide')
    return () => (
      <div className="dropdown-item" onClick={hide}>
        <span>{props.label}</span>
      </div>
    )
  }
})
const DropdownComponent = defineComponent({
  props: {
    option: { type: Object }
  },
  setup(props, ctx) {
    const state = reactive({
      option: props.option,
      isShow: false,
      top: 0,
      left: 0
    })
    ctx.expose({ //暴露方法给外界
      showDropdown(option) {
        state.option = option
        state.isShow = true
        let { top, left, height } = option.el.getBoundingClientRect();
        state.top = top + height
        state.left = left
      }
    });
    provide('hide', () => state.isShow = false)

    const styles = computed(() => ({
      'top': state.top + 'px',
      'left': state.left + 'px'
    }))

    const el = ref(null)
    const onMousedownDocument = (e) => {
      if (!el.value.contains(e.target)) {
        state.isShow = false
      }
    }

    onMounted(() => {
      document.body.addEventListener('mousedown', onMousedownDocument, true)
    })

    onBeforeUnmount(() => {
      document.body.removeEventListener('mousedown', onMousedownDocument)
    })

    return () => {
      return <div className={state.isShow ? 'dropdown-isShow' : 'dropdown'} style={styles.value} ref={el}>
        {state.option.content()}
      </div>
    }
  }
})

let vm;
export function $dropdown(option) {
  if (!vm) {
    let el = document.createElement('div')
    // 将组件渲染成虚拟节点
    vm = createVNode(DropdownComponent, { option })
    // 渲染成真实节点
    render(vm, el);
    document.body.appendChild(el)
  }
  let { showDropdown } = vm.component.exposed
  showDropdown(option)
}