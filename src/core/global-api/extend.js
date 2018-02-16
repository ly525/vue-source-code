/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { warn, extend, mergeOptions } from '../util/index'
import { defineComputed, proxy } from '../instance/state'

export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   * 每一个继承 Vue 的对象都有唯一的 cid
   * 首先给 Vue 添加了一个 cid，它的值为 0，之后每次通过 Vue.extend 创建的子类的 cid 值依次递增。
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   * Vue.component 与 Vue.extend 构造出来的组件有什么不同?
   * .extend 是构建一个组件的语法器，传入参数，得到一个组件。然后可以使用Vue.component 这个全局方法进行组件注册，这样就可以在任意 vue 模板里面使用 该组件了
   * .component 你可以创建 ，也可以取组件。Vue.component('name', comp) => 注册全局组件. Vue.component('name') => 取已经注册的组件
   */
  Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}
    // Super 保存了当前对象，这里是 Vue 本身
    const Super = this
    // SuperId 是 Vue.cid 即 0
    const SuperId = Super.cid
    // extendOptions._Ctor 用于缓存构造函数，在 Vue 源码中，暂未找到它的用途。
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production') {
      if (!/^[a-zA-Z][\w-]*$/.test(name)) {
        warn(
          'Invalid component name: "' + name + '". Component names ' +
          'can only contain alphanumeric characters and the hyphen, ' +
          'and must start with a letter.'
        )
      }
    }

    const Sub = function VueComponent (options) {
      this._init(options)
    }
    // 这种怎么理解？
    // 参加：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/create
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options // 父级构造函数的options
    Sub.extendOptions = extendOptions // 传入的extendOptions
    Sub.sealedOptions = extend({}, Sub.options) // 保存定义Sub时，它的options值有哪些

    // cache constructor
    cachedCtors[SuperId] = Sub
    /**
     * 它与 Vue 的构造函数相比，增加了四个全局属性，同时也少了一些全局属性。
     * Sub上没有的属性包括：
     * Vue.version = '__VERSION__'
       Vue.compile = compileToFunctions
       Vue.config
       Vue.util
       Vue.set
       Vue.delete
       Vue.nextTick
     */
    return Sub
  }
}

function initProps (Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

function initComputed (Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
