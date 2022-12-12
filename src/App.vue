<template>
  <div class="app">
    <Editor v-model="state" :formData="formData"></Editor>
  </div>
</template>

<script>
import { ref } from "@vue/reactivity";
import data from "./data.json";
import Editor from "./packages/editorCom.jsx";
import { registerConfig as config } from "./utils/editor-config.jsx";
import { provide } from "@vue/runtime-core";
export default {
  components: {
    Editor,
  },
  setup() {
    const state = ref(data);
    provide("config", config);
    const formData = ref({
      username: "deerrrrr",
      password: "123",
      start: 0,
      end: 100,
    });
    return {
      state,
      formData,
    };
  },
};
</script>

<style lang="scss">
.app {
  width: 100%;
  height: 100%;
  position: fixed;
}
</style>
