import deepcopy from "deepcopy"
import { ElButton, ElDialog, ElInput, ElTable, ElTableColumn } from "element-plus"
import { createVNode, defineComponent, reactive, render } from "vue"

const TableComponent = defineComponent({
  props: {
    option: { type: Object }
  },
  setup(props, ctx) {
    const state = reactive({
      option: props.option,
      isShow: false,
      editData: [] //编辑的数据
    })
    const methods = {
      show(option) {
        state.option = option
        state.isShow = true
        state.editData = deepcopy(option.data)
      }
    }
    const add = () => {
      state.editData.push({})
    }
    const onCancel = () => {
      state.isShow = false
    }
    const onConfirm = () => {
      state.option.onConfirm(state.editData)
      onCancel()
    }
    ctx.expose(methods);
    return () => {
      return <ElDialog v-model={state.isShow} title={state.option.config.label}>
        {{
          default: () => (
            <div>
              <div>
                <ElButton onClick={add}>添加</ElButton>
                <ElButton>重置</ElButton>
              </div>
              <ElTable data={state.editData}>
                <ElTableColumn type="index"></ElTableColumn>
                {
                  state.option.config.table.options.map((item) => {
                    return <ElTableColumn label={item.label}>
                      {{
                        default: ({ row }) => <ElInput v-model={row[item.field]}></ElInput>
                      }}
                    </ElTableColumn>
                  })
                }
                <ElTableColumn label="操作">
                  <ElButton type="danger">删除</ElButton>
                </ElTableColumn>
              </ElTable>
            </div>
          ),
          footer: () => <>
            <ElButton onClick={onCancel}>取消</ElButton>
            <ElButton onClick={onConfirm}> 确定</ElButton>
          </>
        }
        }

      </ElDialog >
    }
  }
})

let vm;
export const $tableDialog = (option) => {
  if (!vm) {
    const el = document.createElement('div')
    vm = createVNode(TableComponent, { option })
    render(vm, el)
    document.body.appendChild(el)
  }
  let { show } = vm.component.exposed;
  show(option)
}