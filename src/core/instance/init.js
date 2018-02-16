/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    // 性能统计相关
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    // 监听对象变化时用于过滤vm
    vm._isVue = true
    // merge options
    // 在使用 Vue 开发项目的时候，我们是不会使用 _isComponent 选项的，这个选项是 Vue 内部使用的
    // _isComponent 是内部创建子组件时才会添加为 true 的属性
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // 内部使用Vnode部分使用
      initInternalComponent(vm, options)
    } else {
      /**
       * mergeOptions => Vue中处理属性的合并策略的地方
       * 这样 Vue 第一步所做的事情就来了：使用策略对象合并参数选项
       * mergeOptions用于合并两个对象，不同于Object.assign的简单合并，它还对数据还进行了一系列的操作，且源码中多处用到该方法，所以后面会详细讲解这个方法
       * Ctor.super 是在调用Vue.extend时，才会添加的属性，这里先直接跳过。
       * 所以 mergeOptions 的第一个参数就是上面的Ctor.options，第二个参数是我们传入的options，第三个参数是当前对象vm。
       *
       */
      vm.$options = mergeOptions(
        // resolveConstructorOptions方法在Vue.extend(https://github.com/liutao/vue2.0-source/blob/master/Vue.extend.md)中做了详细的解释，
        // 它的作用是合并构造器及构造器父级上定义的options
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
      /**
       * 最后合并之后的vm.$option如下：
        vm.$option = {
          components: {
            KeepAlive,
            Transition,
            TransitionGroup
          },
          directives: {
            model,
            show
          },
          filters: {},
          _base: Vue,
          el: '#app',
          data: function mergedInstanceDataFn(){}
        }
       */
    }
    /**
     * _init 合并完选项之后，Vue 第二部做的事情就来了：初始化工作与Vue实例对象的设计
     */
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // 如果是开发环境，则 vm._renderProxy 值为一个 Proxy 代理对象
      initProxy(vm)
    } else {
      // 生产环境就是 vm 自身，这里不展开赘述。
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // 这些方法是在处理Vue实例对象，以及做一些初始化的工作
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    // console.log('init finish')
    // initInjections 和 initProvide 搭配使用，用于将伏组件 _provided 中定义的值，通过 inject 注入到子组件中，且这些子组件不会被观察
    /**
     * demo:
       <div id="app">
         <p>{{message}}</p>
         <child></child>
       </div>
       <script type="text/javascript">
           var vm = new Vue({
              el: '#app',
              data: {
                message: '第一个vue实例'
              },
              components: {
                child: {
                  template: "<div>{{a}}</div>",
                  inject: ['a']
                }
              },
              provide: {
                a: 'a'
              }
           })
     </script>
     */
    initProvide(vm) // resolve provide after data/props

    // 我们看到create阶段，基本就是对传入数据的格式化、数据的双向绑定、以及一些属性的初始化
    // 接下来分析: $mount => src/platforms/web/entry-runtime-with-compiler.js
    callHook(vm, 'created')

    /* istanbul ignore if */
    // 性能相关
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    /**
     * 如果有 vm.$options.el 还要调用 vm.$mount(vm.$options.el)
     * 这就是为什么如果不传递 el 选项就需要手动 mount 的原因了。
     * 调用的 vm.$mount 方法来自 entry-runtime-with-compiler.js => Vue.prototype.$mount 方法
     */
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode
  opts._parentElm = options._parentElm
  opts._refElm = options._refElm

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  /**
   * 这里的Ctor就是vm.constructor也就是Vue对象
   * Ctor => Vue 构造函数本身, 下面的代码相当于 let options = Vue.options
   * Vue.options 初步在 initGlobalAPI(core/index.js) 中进行初始赋值
   * Vue.options 之后在 web-runtime.js 之后，进行完善，安装平台相关信息.
   * http://jietu-10024907.file.myqcloud.com/awqxqmzaxdynndbnesbcgxjcxdbraggv.jpg
   *
   *
    Ctor.options = {
      components: {
        KeepAlive,
        Transition,
        TransitionGroup
      },
      directives: {
        model,
        show
      },
      filters: {},
      _base: Vue
    }
   */
  let options = Ctor.options
  /** 有super属性，说明 Ctor 是通过 Vue.extend() 方法创建的子类
   * 因为 Sub上也有全局的 extend 方法，
   * demo:
   <div id="mount-point"></div>
   <script>
     var Profile = Vue.extend({
        template: '<p>{{firstName}} {{lastName}} aka {{alias}}</p>',
        data: function () {
          return {
            firstName: 'Walter',
            lastName: 'White',
            alias: 'Heisenberg'
          }
        }
     })
     new Profile().$mount('#mount-point')
   </script>
   在这种情况下传入的 Ctor 就是 Profile, 也就是 Vue.extend 中说的 Sub。 Ctor.super 即 Vue，因为 Sub上也有全局的 extend 方法
   所以可能会有 Profile2 = Profile.extend({})的情况。
   */
  if (Ctor.super) {
    // superOptions 递归调用了 resolveConstructorOptions 来获得父级的 options
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    /**
     * 如果 Ctor 上保存的 superOptions 与通过递归调用 resolveConstructorOptions 获取到的 options 不同，
     * 则说明父级构造器上 options 属性值改变了，if (superOptions !== cachedSuperOptions)里面的操作其实就是更新 Ctor 上 options 相关属性。
     * 该种情况的出现比如如下例子：
     var Profile = Vue.extend({
        template: '<p>{{firstName}} {{lastName}} aka {{alias}}</p>',
      });
     Vue.mixin({
        data: function () {
          return {
            firstName: 'Walter',
            lastName: 'White',
            alias: 'Heisenberg'
          }
        }
      });
     new Profile().$mount('#mount-point');
     // 该例子可以正常运行，但是如果你注释掉if块的内容，就无法运行了。
     // 页面中输出的文字就只剩下aka了。这是因为Vue.mixin执行时，会替换Vue.options的值。
     // Vue.mixin 实际内容：this.options = mergeOptions(this.options, mixin)
     // 而我们new Profile时，获取到Vue上的options的值还是旧的，所以没有正常渲染。
     */
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      // Ctor.superOptions指向最新的superOptions
      // 通过resolveModifiedOptions方法获得修改的options值
      // 其实就是以options为基础，把options的值和sealedOptions的值作比较，如果不同，若为数组，则合并数组，否则舍弃sealedOptions的值。
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      // 如果modifiedOptions值不为空，则合并到 Ctor.extendOptions
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      // 更新Ctor.options的值
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const extended = Ctor.extendOptions
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = dedupe(latest[key], extended[key], sealed[key])
    }
  }
  return modified
}

function dedupe (latest, extended, sealed) {
  // compare latest and sealed to ensure lifecycle hooks won't be duplicated
  // between merges
  if (Array.isArray(latest)) {
    const res = []
    sealed = Array.isArray(sealed) ? sealed : [sealed]
    extended = Array.isArray(extended) ? extended : [extended]
    for (let i = 0; i < latest.length; i++) {
      // push original options and not sealed options to exclude duplicated options
      if (extended.indexOf(latest[i]) >= 0 || sealed.indexOf(latest[i]) < 0) {
        res.push(latest[i])
      }
    }
    return res
  } else {
    return latest
  }
}
