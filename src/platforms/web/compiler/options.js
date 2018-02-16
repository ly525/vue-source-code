/* @flow */

import {
  isPreTag,
  mustUseProp,
  isReservedTag,
  getTagNamespace
} from '../util/index'

import modules from './modules/index'
import directives from './directives/index'
import { genStaticKeys } from 'shared/util'
import { isUnaryTag, canBeLeftOpenTag } from './util'

export const baseOptions: CompilerOptions = {
  expectHTML: true,
  modules, // 包括 class 和 style，对模板中类和样式的解析
  directives, // model（v-model）、html（v-html）、text(v-text)三个指令。
  isPreTag, // 是否是pre标签。
  isUnaryTag,
  mustUseProp, // 需要使用props绑定的属性，比如value、selected等。
  canBeLeftOpenTag, // 可以不闭合的标签，比如tr、td等。
  isReservedTag, // 是否是保留标签，html标签和SVG标签。
  getTagNamespace, // 获取命名空间，svg和math。
  staticKeys: genStaticKeys(modules) // 静态关键词，包括staticClass,staticStyle。
}
