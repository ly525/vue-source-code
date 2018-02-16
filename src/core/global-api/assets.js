/* @flow */

import config from '../config'
import { ASSET_TYPES } from 'shared/constants'
import { warn, isPlainObject } from '../util/index'

/**
 *
 * @param Vue
 * 参见 https://github.com/liutao/vue2.0-source/blob/master/%E8%87%AA%E5%AE%9A%E4%B9%89%E6%8C%87%E4%BB%A4.md
 * [全局指令] 的实现方式，和全局组件、全局过滤器一致。
 * 全局指令 demo
    Vue.directive('demo', {
        bind: function(){
          ...
        }
    })
 */
export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   *
   -------------------- Vue.component 解析 --------------------
   Vue.component('my-component', componentOption)
   Vue.component('my-component', {
     template: '<div>A custom component</div>'
   })

   这一步：给 Vue 的全局属性 options 的 components 添加 当前的 组件的定义。相当于：

   Vue.options.components['my-component'] = Vue.extend({
      name: 'my-component',
      template: '<div>A custom component!</div>'
   })

   Vue.extend 的作用是构建一个继承 Vue 的子类 Sub。其中 Sub.options = componentOption， 然后在 new Vue 或者 new VueComponent()的时候，会执行mergeOptions

   */
  ASSET_TYPES.forEach(type => {
    /**
     *
     * @param id 指令名
     * @param definition 函数或一个对象, 如果是函数，则会创建一个对象，并把 definition 赋值给 bind 和 update 属性。
     * @returns {Function|Object}
     * Vue.component = function(){}
     * Vue.directive = function(){}
     * Vue.filter = function(){}
     *
     * demo:
        1. Vue.component('my-component', {
          template: '<div>A custom component</div>'
        })
        2. Vue.componet('chart', Echarts)
     *
     */
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      console.log('Vue[type]')
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production') {
          if (type === 'component' && config.isReservedTag(id)) {
            warn(
              'Do not use built-in or reserved HTML elements as component ' +
              'id: ' + id
            )
          }
        }
        // isPlainObject()函数用于判断指定参数是否是一个纯粹的对象。
        // 所谓"纯粹的对象"，就是该对象是通过"{}"或"new Object"创建的。

        if (type === 'component' && isPlainObject(definition)) {
          // 如果是 demo 中的第一种情况，进入 该语句执行
          definition.name = definition.name || id
          // Vue.options._base = Vue
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          // 如果 definition 是函数，则会新建一个对象，并把 definition 赋值给 bind 和 update 属性
          definition = { bind: definition, update: definition }
        }
        // 在实例化组件对象时，会合并到 vm.$options 上。
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}

/**
 * 局部指令的定义：
   new Vue({
      directives: {
        demo: {
          bind: function(){
           ...
          }
        }
      }
   })
 其实同全局指令类似，demo的值也可以是一个函数，在合并配置项时，会新建一个对象，并把赋值给bind和update属性。
 自定义指令的用法和内置指令的用法一致，通过v-指令名的方式添加到模板的标签上，然后在对应的钩子函数中，执行相应的操作。
 */
