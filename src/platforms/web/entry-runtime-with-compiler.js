/* @flow */
/* 入口文件，也就是build文件夹下config.js中配置的入口文件。看源码可以从这里看起 */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index' // query 可以理解为 document.querySelector. 只不过内部判断了一下el是不是字符串，不是的话就直接返回，所以我们的el也可以直接传入dom元素
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

// 缓存来自 web-runtime.js 文件的 $mount 函数
// $mount 其实 是调用 lifecycle.js 文件中的 _mount (mountComponent)方法
const mount = Vue.prototype.$mount

// 然后覆盖了 Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean // hydrating是与服务器渲染(SSR)相关的，浏览器端可以不用管。
): Component {
  el = el && query(el)

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  /**
   * 之前是 src/core/instance/init.js => _init
   * 1、缓存来自 web-runtime.js 文件的 $mount 方法
   * 2、判断有没有传递 render 选项，如果有直接调用来自 web-runtime.js 文件的 $mount 方法 => mount.call(this, el, hydrating)
   * 3、如果没有传递 render 选项，(则获取template，template可以是#id、模板字符串、dom元素，如果没有template，则获取el以及其子内容作为模板)
   *    那么查看有没有 template 选项，如果有就使用 compileToFunctions 函数根据其内容编译成 render 函数
   * 4、如果没有 template 选项，那么查看有没有 el 选项，如果有就使用 compileToFunctions 函数将其内容(template = getOuterHTML(el))编译成 render 函数
   * 5、将编译成的 render 函数挂载到 this.$options 属性下，并调用缓存下来的 web-runtime.js 文件中的 $mount 方法
   * 演示图：http://7xlolm.com1.z0.glb.clouddn.com/vueimgmount.png
   */

  const options = this.$options
  // resolve template/el and convert to render function
  // 如果我们没有写 render 选项，那么就尝试将 template 或者 el 转化为 render 函数
  if (!options.render) {
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }
      // src/platforms/web/compiler/index.js compileToFunctions 中调用了 compile，compile 中调用了 baseCompile。
      // 主要的操作就是 baseCompile 中的三步。最终生成 render 函数
      const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      console.log(render)
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  // 调用已经缓存下来的 src/platforms/web/runtime/index.js: $mount => src/core/instance/lifecycle.js: mountComponent
  // 这个$mount 方法最终是
  // console.log('mounted')
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

// 在 Vue 上挂载 compile, compileToFunctions 函数的作用，就是将模板 template 编译为render函数。
Vue.compile = compileToFunctions

export default Vue
