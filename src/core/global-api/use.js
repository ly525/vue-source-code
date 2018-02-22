/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    const args = toArray(arguments, 1)
    // unshift() 方法将一个或多个元素添加到数组的开头，并返回新数组的长度
    args.unshift(this)
    // 调用 组件/插件/框架 暴露的 install 函数
    // install 函数的本质：调用 Vue.component(组件名，组件)， 比如 Vue.component('VueDatePicker', VueDatePicker)
    // 而 Vue.component 的本质是把 组件挂在的 vm 的$options 上，这样在在编译模板的时候，如果发现元素是自定义组件，就可以使用 vm.$options 的自定义组件了
    
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    // 将新添加的组件放到数组中，防止重复添加
    installedPlugins.push(plugin)
    return this
  }
}
