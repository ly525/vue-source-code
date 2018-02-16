/* @flow */

import { warn } from 'core/util/index'
import { cached, isUndef } from 'shared/util'

const normalizeEvent = cached((name: string): {
  name: string,
  once: boolean,
  capture: boolean,
  passive: boolean
} => {
  const passive = name.charAt(0) === '&'
  name = passive ? name.slice(1) : name
  const once = name.charAt(0) === '~' // Prefixed last, checked first
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
  return {
    name,
    once,
    capture,
    passive
  }
})

export function createFnInvoker (fns: Function | Array<Function>): Function {
  function invoker () {
    const fns = invoker.fns
    if (Array.isArray(fns)) {
      const cloned = fns.slice()
      for (let i = 0; i < cloned.length; i++) {
        cloned[i].apply(null, arguments)
      }
    } else {
      // return handler return value for single handlers
      return fns.apply(null, arguments)
    }
  }
  invoker.fns = fns
  return invoker
}

// Vue中，对于 DOM 事件的添加销毁处理。
export function updateListeners (
  on: Object,
  oldOn: Object,
  add: Function,
  remove: Function,
  vm: Component
) {
  let name, cur, old, event
  // 遍历新添加进来的事件
  for (name in on) {
    cur = on[name]
    old = oldOn[name]
    // 对之前在处理 once 和 capture 时添加在 name 最前面的符号进行翻译
    event = normalizeEvent(name)
    if (isUndef(cur)) {
      process.env.NODE_ENV !== 'production' && warn(
        `Invalid handler for event "${event.name}": got ` + String(cur),
        vm
      )
    } else if (isUndef(old)) { // 如果旧事件中没有该name事件，则调用add方法添加事件
      if (isUndef(cur.fns)) {
        // createFnInvoker 方法会返回一个函数，最终该函数会调用添加到它上面的 fns，只不过还封装了对数组的处理。
        cur = on[name] = createFnInvoker(cur)
      }
      // 调用add方法来添加事件
      add(event.name, cur, event.once, event.capture, event.passive)
    } else if (cur !== old) { // 如果新旧事件都有相同的name事件，则替换事件的回调，这里类似于对dom元素的复用，它对之前绑定的事件做了一个复用。
      old.fns = cur
      on[name] = old
    }
  }
  // 最后，如果是旧事件中独有的，则调用remove方法销毁。
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name)
      // remove 方法来销毁之前添加过的事件
      remove(event.name, oldOn[name], event.capture)
    }
  }
}
