/* @flow */

import config from '../config'
import VNode, { createEmptyVNode } from './vnode'
import { createComponent } from './create-component'

import {
  warn,
  isDef,
  isUndef,
  isTrue,
  isPrimitive,
  resolveAsset
} from '../util/index'

import {
  normalizeChildren,
  simpleNormalizeChildren
} from './helpers/index'

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
// https://segmentfault.com/q/1010000007130348
export function createElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode {
  // isPrimitive 是用来判断是否是基本类型的
  // 如果返回 true，说明该元素没有相关的属性，此时第三个参数实际上是 children 的值，所以后面的值依次向前移动。
  // console.log('tag', tag)
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  // vm.$createElement会对子元素进行最高级的归一化处理。TODO 归一化？？
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  // Vue$3 "my-component" undefined undefined undefined
  return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode {
  if (isDef(data) && isDef((data: any).__ob__)) {
    process.env.NODE_ENV !== 'production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    return createEmptyVNode()
  }
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // warn against non-primitive key
  if (process.env.NODE_ENV !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    warn(
      'Avoid using non-primitive value as key, ' +
      'use string/number value instead.',
      context
    )
  }
  // support single function children as default scoped slot
  // 如果子元素只有一个函数，则作为默认的slot，由于slot涉及到了从模板解析到渲染页面的整个过程，内容比较多
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {}
    data.scopedSlots = { default: children[0] }
    children.length = 0
  }
  // 之后就是对子元素进行归一化，在children的归一化处理中我们已经讲解了它的处理逻辑。
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }
  let vnode, ns
  // console.log('_render => render => _c => createElement => _createElement => _createComponent => vnode')
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
    /**
     * 如果tag是字符串，且是平台保留标签名。则直接创建VNode对象
     */

    if (config.isReservedTag(tag)) {
      // platform built-in elements
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
      // resolveAsset方法其实就是获取context.$options.components中my-component所对应的值
    } else if (isDef(Ctor = resolveAsset(context.$options, 'components', tag))) { // 处理自定义组件
      // component
      /**
       * render = function(){ with(this){_c('my-component')}}
       * Ctor(组件的构造函数，也是 Vue 的子类), 通过 resolveAsset 实际上得到的是 在 Vue.component('my-component', {}) 时候在 Vue.$options.componets 上注册的 Vue 子类: VueComponent (通过Vue.extend 实现)
       * resolveAsset 的代码简化: Ctor = context.$options.components[tag]
       * 这时候也就明白为什么需要在初始化 vm._c 的时候，需要传 vm 作为参数了，这里用到的context 就是 vm，也就是 Vue 实例
       */
      // TODO
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  } else {
    // direct component options / constructor
    // TODO 这边是用在什么场景下？
    /**
     <div id="app">
     </div>
     <script type="text/javascript">
       new Vue({
          render: function(h){
            return h(Vue.extend({
              template: '<div>test</div>'
            }))
          }
        }).$mount('#app');
     </script>
     */
    vnode = createComponent(tag, data, context, children)
  }
  // NS => namespace
  if (isDef(vnode)) {
    if (ns) applyNS(vnode, ns)
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function applyNS (vnode, ns, force) {
  vnode.ns = ns
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined
    force = true
  }
  if (isDef(vnode.children)) {
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      const child = vnode.children[i]
      if (isDef(child.tag) && (isUndef(child.ns) || isTrue(force))) {
        applyNS(child, ns, force)
      }
    }
  }
}
