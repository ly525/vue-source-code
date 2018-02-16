/* @flow */

import {
  warn,
  nextTick,
  emptyObject,
  handleError,
  defineReactive
} from '../util/index'

import { createElement } from '../vdom/create-element'
import { installRenderHelpers } from './render-helpers/index'
import { resolveSlots } from './render-helpers/resolve-slots'
import VNode, { cloneVNodes, createEmptyVNode } from '../vdom/vnode'

import { isUpdatingChildComponent } from './lifecycle'

/**
 *
 * @param vm
 * 这里给vm添加了一些虚拟dom、slot等相关的属性和方法。然后会调用beforeCreate钩子函数。
 */
export function initRender (vm: Component) {
  vm._vnode = null // the root of the child tree
  vm._staticTrees = null // v-once cached trees
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode // the placeholder node in parent tree
  const renderContext = parentVnode && parentVnode.context
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  /**
   * template: <div id="app">{{message}}</div> => render = function(){ with(this) {_c('div', {attrs: {id: 'app'}}, [_t('xxxx')] )}}
   * 我们简单说一下createElement干了什么。
   * a是要创建的标签名，这里是div。
   * 接着b是data，也就是模板解析时，添加到div上的属性等。
   * c是子元素数组，所以这里又调用了_c来创建一个p标签。
   * vm._c 用在 template 编译为 render 函数之后，执行 render 函数时候会用到
   * vm._c 调用 createElement 最后一个参数是 false，而 vm.$createElement 调用 createElement 的最后一个参数是true，
   * 说明 自定义的 render 函数总是对子元素进行归一化处理 TODO ？
   */
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // normalization is always applied for the public version, used in
  // user-written render functions.
  // vm.$createElement是我们自己编写render函数时，作为参数传递给render函数(在 _render 中调用) vnode = render.call(vm._renderProxy, vm.$createElement)
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  const parentData = parentVnode && parentVnode.data

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
    }, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
    }, true)
  } else {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  }
}

export function renderMixin (Vue: Class<Component>) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype)

  Vue.prototype.$nextTick = function (fn: Function) {
    return nextTick(fn, this)
  }

  Vue.prototype._render = function (): VNode {
    const vm: Component = this
    // 解构出 $options 中的 render 函数
    // vm.$options.render 方法是在 web-runtime-with-compiler.js 文件中通过 compileToFunctions 方法将 template 或 el 编译而来的
    const { render, _parentVnode } = vm.$options

    if (vm._isMounted) {
      // if the parent didn't update, the slot nodes will be the ones from
      // last render. They need to be cloned to ensure "freshness" for this render.
      for (const key in vm.$slots) {
        const slot = vm.$slots[key]
        // _rendered is a flag added by renderSlot, but may not be present
        // if the slot is passed from manually written render functions
        if (slot._rendered || (slot[0] && slot[0].elm)) {
          vm.$slots[key] = cloneVNodes(slot, true /* deep */)
        }
      }
    }

    vm.$scopedSlots = (_parentVnode && _parentVnode.data.scopedSlots) || emptyObject

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode
    // render self
    let vnode
    try {
      /**
       * 运行 render 函数
       * 使用 call 指定了 render 函数的作用域环境为 vm._renderProxy，
       * 这个属性在我们整理实例对象的时候知道，他是在 Vue.prototype._init 方法中被添加的，
       * 即：vm._renderProxy = vm，其实就是Vue实例对象本身
       * _v是 createTextVNode，也就是创建一个文本结点。_s 是 _toString，也就是把 message 转换为字符串，在这里，因为有 with(this)，所以message传入的就是我们data中定义的第一个vue实例
       * render = function () {
            with(this){return _c('div',{attrs:{"id":"app"}},[_c('p',[_v(_s(message))])])}
         }
       * 函数调用过程中的this，是vm._renderProxy，是一个Proxy代理对象或vm本身。我们暂且把它当做vm本身
       * 可以看出，render 函数返回的是一个VNode对象，也就是我们的虚拟 dom 对象。它的返回值，将作为 vm._update 的第一个参数
       */
      console.log('render call')
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
      handleError(e, vm, `render`)
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        if (vm.$options.renderError) {
          try {
            vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e)
          } catch (e) {
            handleError(e, vm, `renderError`)
            vnode = vm._vnode
          }
        } else {
          vnode = vm._vnode
        }
      } else {
        vnode = vm._vnode
      }
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      vnode = createEmptyVNode()
    }
    // set parent
    vnode.parent = _parentVnode
    return vnode
  }
}
