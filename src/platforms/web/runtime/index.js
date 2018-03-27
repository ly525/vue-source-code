/* @flow */
/* 运行阶段需要处理的组件、指令和模块 */

/**
  * 1、覆盖 Vue.config 的属性，将其设置为平台特有的一些方法
  * 2、Vue.options.directives 和 Vue.options.components 安装平台特有的指令和组件
  * 3、在 Vue.prototype 上定义 __patch__ 和 $mount
  http://jietu.qq.com/upload/index.html?image=http://jietu-10024907.file.myqcloud.com/cgqkxujiruydigcuzgyuilwgaaquwhob.jpg
 */

import Vue from 'core/index'
import config from 'core/config'
import { extend, noop } from 'shared/util'
import { mountComponent } from 'core/instance/lifecycle'
import { devtools, inBrowser, isChrome } from 'core/util/index'

import {
  query,
  mustUseProp,
  isReservedTag,
  isReservedAttr,
  getTagNamespace,
  isUnknownElement
} from 'web/util/index'

import { patch } from './patch'
import platformDirectives from './directives/index'
import platformComponents from './components/index'

// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

/** 
  * 安装平台特定的utils, 官方的指令、组件大部分都在这
  * directives和components 是保存在 Vue.options 里面的
  * install platform runtime directives & components
*/
extend(Vue.options.directives, platformDirectives) // v-model, v-show
extend(Vue.options.components, platformComponents) // KeepAlive, Transition, TransitionGroup

// install platform patch function
/**
  * 因为transtion并不单单是以一个组件来实现的，它需要操作真实 DOM（未插入文档流）和 virtual dom。
  * 因此需要在Vue构造函数上打一些patch
  * 过渡动画效果相关的 patch 的源码位置： src/platforms/web/runtime/modules/transition.js
*/
Vue.prototype.__patch__ = inBrowser ? patch : noop

// public mount method
// 首先根据是否是浏览器环境决定要不要 query(el) 获取元素，然后将 el 作为参数传递给 this._mount()
// this.picker = this.Panel.$mount(this.$refs.picker)
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  console.log('Vue.prototype.$mount')
  // TODO 这里可以扩展学习 element 的相关属性
  el = el && inBrowser ? query(el) : undefined
  console.log('src/platforms/web/runtime/index.js: $mount => src/core/instance/lifecycle.js: mountComponent')
  return mountComponent(this, el, hydrating)
}

// devtools global hook
/* istanbul ignore next */
Vue.nextTick(() => {
  if (config.devtools) {
    if (devtools) {
      devtools.emit('init', Vue)
    } else if (process.env.NODE_ENV !== 'production' && isChrome) {
      console[console.info ? 'info' : 'log'](
        'Download the Vue Devtools extension for a better development experience:\n' +
        'https://github.com/vuejs/vue-devtools'
      )
    }
  }
  if (process.env.NODE_ENV !== 'production' &&
    config.productionTip !== false &&
    inBrowser && typeof console !== 'undefined'
  ) {
    console[console.info ? 'info' : 'log'](
      `You are running Vue in development mode.\n` +
      `Make sure to turn on production mode when deploying for production.\n` +
      `See more tips at https://vuejs.org/guide/deployment.html`
    )
  }
}, 0)

export default Vue
