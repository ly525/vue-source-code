/* @flow */

import { extend } from 'shared/util'
import { detectErrors } from './error-detector'
import { createCompileToFunctionFn } from './to-function'

export function createCompilerCreator (baseCompile: Function): Function {
  return function createCompiler (baseOptions: CompilerOptions) {
    // 接受两个参数：template 和 options
    function compile (
      template: string,
      options?: CompilerOptions // options 在内部主要是用户自己定义的 delimiters (标识符)
    ): CompiledResult {
      console.log('compiler -->>>')
      // finalOptions 继承自我们上面提到的baseOptions，
      const finalOptions = Object.create(baseOptions) // 自我们上面提到的baseOptions （src/platforms/web/compiler/options.js）
      const errors = []
      const tips = []
      // 并添加了一个搜集错误的warn方法
      finalOptions.warn = (msg, tip) => {
        (tip ? tips : errors).push(msg)
      }
      // 然后合并了options传入的各种配置选项
      // modules和directives合并方法不同是因为modules是数组，而directives是一个对象
      if (options) {
        // merge custom modules
        if (options.modules) {
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules)
        }
        // merge custom directives
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives),
            options.directives
          )
        }
        // copy other options
        for (const key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key]
          }
        }
      }
      // baseCompile中执行的就是模板编译的三个重要步骤（生成ast、优化静态内容、生成render），后面我们会详细讲解。
      const compiled = baseCompile(template, finalOptions)
      if (process.env.NODE_ENV !== 'production') {
        errors.push.apply(errors, detectErrors(compiled.ast))
      }
      compiled.errors = errors
      compiled.tips = tips
      return compiled
    }

    /**

     compile和compileToFunctions两个方法的不同之处有以下几点。
     1、 compile返回的结果中render是字符串，staticRenderFns是字符串组成的数组，而compileToFunctions中把它们变成了函数。
     2、 compile返回的结果中，有模板生成的ast和搜集到的错误。而compileToFunctions对其结果进行了一些处理。
     */

    return {
      compile,
      // compileToFunctions里面调用了compile
      compileToFunctions: createCompileToFunctionFn(compile)
    }
  }
}
