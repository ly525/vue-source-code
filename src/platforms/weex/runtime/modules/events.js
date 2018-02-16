/* @flow */

import { updateListeners } from 'core/vdom/helpers/update-listeners'

let target: any

function add (
  event: string,
  handler: Function,
  once: boolean,
  capture: boolean
) {
  if (capture) {
    console.log('Weex do not support event in bubble phase.')
    return
  }

  // 封装 once 的处理，once 的处理其实就是把回调封装了一层，在调用的时候，销毁事件，之后再调用就无效了。
  if (once) {
    const oldHandler = handler
    const _target = target // save current target element in closure
    handler = function (ev) {
      const res = arguments.length === 1
        ? oldHandler(ev)
        : oldHandler.apply(null, arguments)
      if (res !== null) {
        remove(event, null, null, _target)
      }
    }
  }
  target.addEvent(event, handler)
}

function remove (
  event: string,
  handler: any,
  capture: any,
  _target?: any
) {
  // TODO removeEvent 这个需要学习！没有见过这个方法，之前见到的是 removeEventListener
  (_target || target).removeEvent(event)
}

function updateDOMListeners (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (!oldVnode.data.on && !vnode.data.on) {
    return
  }
  const on = vnode.data.on || {}
  const oldOn = oldVnode.data.on || {}
  target = vnode.elm
  updateListeners(on, oldOn, add, remove, vnode.context)
  target = undefined
}

export default {
  create: updateDOMListeners,
  update: updateDOMListeners
}
