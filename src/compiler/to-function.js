/* @flow */

import { noop, extend } from 'shared/util'
import { warn as baseWarn, tip } from 'core/util/debug'

type CompiledFunctionResult = {
  render: Function;
  staticRenderFns: Array<Function>;
};

/**
 * 表达式解析
 * 解析 template 中: {{ mess.splite('').reverse().join('') }} 过程
 * 1. 首先, 调用Vue.parsers.text.parseText(str), 解析成一个tokens对象
 * 2. tokens = [
     {
       html: false,
       hasOneTime: false,
       tag: true,
       value: "mess.split('').reverse().join('')" // 通过正则获取到了大括号的内容, 这个同时也可以用作搜索高亮
     }
   ]
 * 3. 然后用 Vue.parsers.text.tokensToExp(tokens) 取出 value, 赋值为一个字符串表达式: expression = "mess.split('').reverse().join('')";
 * 4. 重点✨✨✨：
        1. 这个 expression 正是创建 watcher 时所用的表达式. => new Watch(exp, cb). (当数据作了更新的时候，会执行 callback，从而更新UI)
        2. wathcer 为表达式 和 数据 建立联系的时候, 会解析这个表达式 并获取值。
        3. var res = Vue.parsers.expresssion.parseExpresstion(expression)。解析这个表达式, 其实是为它定义了 getter 和 setter 方法
        4. 为了能定义并使用这两个方法, 表达式必须是合法的路径, 而且要有值
 * 5. 表达式的getter 方法结合组件的数据获取表达式的值, 通过 Function 构造器为表达式求值
       var getter = function( s, expression ){
          return new Function(   'return ' + s+'.'+ expression + ';' );
      }

 * 6. 获取表达式的值时, 执行 getter方法 从作用域对象内取值.
 * 7. 举例:
        <template>{{ mess.splite('').reverse().join('') }}</template>
        new Vue({
          data: {
             model: {mess: 'abc'}
          }
        })
 * 8. 这里利用 new Function 可以传入字符串,解析成js语句, 来解析字符串表达式;
      var fn = getter( 'model', `mess.splite('').reverse().join('')` );
      fn(); => 'cba'
 * 9. 或者
      getter = new Function(code);
      new Vue({
        data: {
          mess: { 'abc'}
        }
      })
      fn = getter(`mess.splite('').reverse().join('')`)
      fn() => 'cba'
 *
 */

function createFunction (code, errors) {
  try {
    return new Function(code)
  } catch (err) {
    // 搜集错误
    errors.push({ err, code })
    return noop
  }
}

export function createCompileToFunctionFn (compile: Function): Function {
  const cache: {
    [key: string]: CompiledFunctionResult;
  } = Object.create(null)

  return function compileToFunctions (
    template: string,
    options?: CompilerOptions,
    vm?: Component
  ): CompiledFunctionResult {
    options = extend({}, options)
    const warn = options.warn || baseWarn
    delete options.warn

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      // detect possible CSP restriction
      try {
        new Function('return 1')
      } catch (e) {
        if (e.toString().match(/unsafe-eval|CSP/)) {
          warn(
            'It seems you are using the standalone build of Vue.js in an ' +
            'environment with Content Security Policy that prohibits unsafe-eval. ' +
            'The template compiler cannot work in this environment. Consider ' +
            'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
            'templates into render functions.'
          )
        }
      }
    }

    // check cache
    // 首先从缓存中获取编译结果，没有则调用compile函数来编译
    const key = options.delimiters
      ? String(options.delimiters) + template
      : template
    if (cache[key]) {
      return cache[key]
    }

    // compile
    const compiled = compile(template, options)

    // check compilation errors/tips
    // 在开发环境，我们在这里会抛出编译过程中产生的错误
    if (process.env.NODE_ENV !== 'production') {
      if (compiled.errors && compiled.errors.length) {
        warn(
          `Error compiling template:\n\n${template}\n\n` +
          compiled.errors.map(e => `- ${e}`).join('\n') + '\n',
          vm
        )
      }
      if (compiled.tips && compiled.tips.length) {
        compiled.tips.forEach(msg => tip(msg, vm))
      }
    }

    // turn code into functions
    const res = {}
    const fnGenErrors = []
    res.render = createFunction(compiled.render, fnGenErrors)
    res.staticRenderFns = compiled.staticRenderFns.map(code => {
      return createFunction(code, fnGenErrors)
    })

    // check function generation errors.
    // this should only happen if there is a bug in the compiler itself.
    // mostly for codegen development use
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn(
          `Failed to generate render function:\n\n` +
          fnGenErrors.map(({ err, code }) => `${err.toString()} in\n\n${code}\n`).join('\n'),
          vm
        )
      }
    }

    return (cache[key] = res)
  }
}
