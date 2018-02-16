/* @flow */

/**
 * 模板解析的相关文件
 * 1. 生成 ast
 * 2. 优化静态内容
 * 3. 生成 render
 */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
// 用法：createCompiler(baseOptions)
// export const createCompiler = createCompilerCreator(cb)
// createCompilerCreator return a function
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 解析template，生成ast
  const ast = parse(template.trim(), options)
  // optimize(ast, options) 主要是对 ast 进行优化，分析出静态不变的内容部分，增加了部分属性
  // 优化静态内容
  optimize(ast, options)
  // 根据 ast 生成 render 函数和 staticRenderFns 数组。
  const code = generate(ast, options)
  // 我们可以知道其实 template 最终还是转换为 render 函数，这也是官方文档中所说的 render 函数更加底层。
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
    /**
     * 根据下面的 demo template 生成的 render
     * 在 src/core/instance/render.js => renderMixin 中，我们曾经添加过如下多个函数(src/core/instance/render-helpers/index.js)，这里和 render 内返回值调用一一对应

       <- render template ->

       <div id="app">
        <p>{{message}}</p>
       </div>

        <- render demo ->

        render = function () {
          with(this){return _c('div',{attrs:{"id":"app"}},[_c('p',[_v(_s(message))])])}
        }

     */

    /**
     * staticRender 就是 静态 HTML 内容，没有和变量绑定

     <- static template demo: ->

       <div id="app">
         <p>这是<span>静态内容</span></p>
         <p>{{message}}</p>
       </div>

     <- staticRenderFns demo: ->

       staticRenderFns = function () {
          with(this){return _c('p',[_v("这是"),_c('span',[_v("静态内容")])])}
       }

     */
})

/**

 <- demo template ->

 <div id="app">
  <p>{{message}}</p>
 </div>

 ---------
 const ast = parse(template.trim(), options)
 ---------

 <- ast ->

   {
     type: 1,
     tag: 'div',
     plain: false,
     parent: undefined,
     attrs: [{name:'id', value: '"app"'}],
     attrsList: [{name:'id', value: 'app'}],
     attrsMap: {id: 'app'},
     children: [{
       type: 1,
       tag: 'p',
       plain: true,
       parent: ast,
       attrs: [],
       attrsList: [],
       attrsMap: {},
       children: [{
         expression: "_s(message)",
         text: "{{message}}",
         type: 2
       }]
   }

   --------
   optimize(ast, options) 优化 ast
   --------

   <- 优化的 ast ->
   <- 因为 template 只有一个动态的 {{message}}，所以 static 和 staticRoot 都是 false。->

   {
      type: 1,
      tag: 'div',
      plain: false,
      parent: undefined,
      attrs: [{name:'id', value: '"app"'}],
      attrsList: [{name:'id', value: 'app'}],
      attrsMap: {id: 'app'},
      static: false,
      staticRoot: false,
      children: [{
        type: 1,
        tag: 'p',
        plain: true,
        parent: ast,
        attrs: [],
        attrsList: [],
        attrsMap: {},
        static: false,
        staticRoot: false,
        children: [{
          expression: "_s(message)",
          text: "{{message}}",
          type: 2,
          static: false
        }]
  }

  */
