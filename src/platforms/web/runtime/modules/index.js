/**
 * modules 和之前编译html文本时类似，这里是对一些特殊内容的特殊处理
 * 它内部提供了一组又一组的create、update、destroy方法，在patch的不同时间分别调用
 */

import attrs from './attrs'
import klass from './class'
import events from './events'
import domProps from './dom-props'
import style from './style'
import transition from './transition'

export default [
  attrs,
  klass,
  events,
  domProps,
  style,
  transition
]
