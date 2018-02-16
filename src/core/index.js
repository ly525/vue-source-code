/* 核心代码 */

import Vue from './instance/index' // 从 instance/index 中导入已经在[原型]上挂载了方法和属性后的 Vue
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'


initGlobalAPI(Vue) // initGlobalAPI 的作用是在[ Vue 构造函数 ] 上挂载静态属性和方法

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

Vue.version = '__VERSION__'

export default Vue
