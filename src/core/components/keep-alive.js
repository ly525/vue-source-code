/* @flow */

import { isRegExp, remove } from 'shared/util'
import { getFirstComponentChild } from 'core/vdom/helpers/index'

/**
 * Vue中，有三个内置的抽象组件，分别是 keep-alive、transition 和 transition-group
 * 它们都有一个共同的特点，就是自身不会渲染一个DOM元素，也不会出现在父组件链中。
 * keep-alive 的作用，是包裹动态组件时，会缓存不活动的组件实例，而不是销毁它们。
 * 该组件会在 Vue 初始化时，添加在 Vue.options.components 上，所以在所有的组件中，都可以直接只用它。
 * keep-alive本身也是一个组件
 */

type VNodeCache = { [key: string]: ?VNode }

/**
 * @param opts
 * @returns {VNodeComponentOptions|string}
 * 获得组件名称
 */
function getComponentName (opts: ?VNodeComponentOptions): ?string {
  return opts && (opts.Ctor.options.name || opts.tag)
}

function matches (pattern: string | RegExp | Array<string>, name: string): boolean {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

function pruneCache (keepAliveInstance: any, filter: Function) {
  const { cache, keys, _vnode } = keepAliveInstance
  for (const key in cache) {
    const cachedNode: ?VNode = cache[key]
    if (cachedNode) {
      // 通过getComponentName方法来获取组件名，然后判断该组件是否合法
      // 如果include不匹配或exclude匹配，则说明该组件不需要缓存，
      // 此时直接返回该vnode
      const name: ?string = getComponentName(cachedNode.componentOptions)
      console.log('component name:', name)
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
}

function pruneCacheEntry (
  cache: VNodeCache,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const cached = cache[key]
  if (cached && (!current || cached.tag !== current.tag)) {
    // TODO destory 做了什么事情？ 换句话说，组件销毁究竟是指什么？有什么应用场景
    cached.componentInstance.$destroy()
  }
  cache[key] = null
  remove(keys, key)
}

const patternTypes: Array<Function> = [String, RegExp, Array]

// 定义 keep-alive 组件
export default {
  name: 'keep-alive',
  /**
   * abstract: true 这个条件我们自己定义组件时通常不会用, 它自身不会渲染一个真实的DOM元素。
   * 比如在创建两个vm实例之间的父子关系时，会跳过抽象组件的实例:
       let parent = options.parent

       if (parent && !options.abstract) {
          while (parent.$options.abstract && parent.$parent) {
              parent = parent.$parent
          }
            parent.$children.push(vm)
       }
   */
  abstract: true, // TODO abstract的作用？
  // props表示: 我们可以传入 include 来匹配哪些组件可以缓存，exclude 来匹配哪些组件不缓存。
  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  // created钩子函数调用时，会创建一个 this.cache 对象用于缓存它的子组件
  created () {
    this.cache = Object.create(null)
    this.keys = []
  },

  // destroyed表示keep-alive被销毁时，会同时销毁它缓存的组件，并调用deactivated钩子函数。
  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  // watch 是在我们改变 props 传入的值时，同时对 this.cache 缓存中的数据进行处理。
  watch: {
    include (val: string | RegExp | Array<string>) {
      pruneCache(this, name => matches(val, name))
    },
    exclude (val: string | RegExp | Array<string>) {
      pruneCache(this, name => !matches(val, name))
    }
  },

  /**
   * 抽象组件没有实际的DOM元素，所以也就没有template模板，它会有一个render函数
   * 1. keep-alive本身也是一个组件，
   * 2. 在render函数调用生成vnode后，同样会走__patch__。在创建和 diff 的过程中也会调用init、prepatch、insert和destroy钩子函数。
   * 3. 不过，每个钩子函数中所做的处理，和普通组件有所不同。(src/core/vdom/create-component.js => init)
   * 4.
   */
  render () {
    console.log('render')
    // 首先，调用getFirstComponentChild方法，来获取this.$slots.default中的第一个元素
    // this.$slots.default 中包含的是什么内容， 参见 https://github.com/liutao/vue2.0-source/blob/master/slot%E5%92%8C%E4%BD%9C%E7%94%A8%E5%9F%9F%E6%8F%92%E6%A7%BD.md
    const slot = this.$slots.default
    // getFirstComponentChild 会过滤掉非自定义的标签（比如html标签），然后获取第一个自定义标签所对应的vnode。
    const vnode: VNode = getFirstComponentChild(slot)
    // VNode 的介绍参见: https://github.com/liutao/vue2.0-source/blob/master/vdom%E2%80%94%E2%80%94VNode.md
    // componentOptions 包含五个元素 { Ctor, propsData, listeners, tag, children }
    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      // check pattern
      const name: ?string = getComponentName(componentOptions)

      // 如果include不匹配或exclude匹配，则说明该组件不需要缓存。此时直接返回该vnode。
      const { include, exclude } = this
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      const { cache, keys } = this
      // 否则，vnode.key不存在则生成一个，存在则就用vnode.key作为key
      const key: ?string = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key

      // 然后 把该 vnode 添加到 this.cache 中
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance
        // make current key freshest
        remove(keys, key)
        keys.push(key)
      } else {
        cache[key] = vnode
        keys.push(key)
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
      }
      // 并设置vnode.data.keepAlive = true。最终返回该vnode。
      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
}
