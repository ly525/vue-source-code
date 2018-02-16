/* @flow */
/* 通用生成render函数之前需要处理的指令 */

import on from './on'
import bind from './bind'
import { noop } from 'shared/util'

export default {
  on,
  bind,
  cloak: noop
}
