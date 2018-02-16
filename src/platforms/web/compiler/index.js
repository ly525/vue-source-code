/* @flow */
/* 编译阶段需要处理的指令和模块 */

// baseOptions 主要保存了解析模板时和平台相关的一些配置
import { baseOptions } from './options'
import { createCompiler } from 'compiler/index'

// src/compiler/index.js => baseCompile
const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions }

/**
 *

 import { isUnaryTag, canBeLeftOpenTag } from './util'
 import { genStaticKeys } from 'shared/util'
 import { createCompiler } from 'compiler/index'

 import modules from './modules/index'
 import directives from './directives/index'

 import {
  isPreTag,
  mustUseProp,
  isReservedTag,
  getTagNamespace
} from '../util/index'

 export const baseOptions: CompilerOptions = {
  expectHTML: true,
  modules,
  directives,
  isPreTag,
  isUnaryTag,
  mustUseProp,
  canBeLeftOpenTag,
  isReservedTag,
  getTagNamespace,
  staticKeys: genStaticKeys(modules)
}

 const { compile, compileToFunctions } = createCompiler(baseOptions)
 export { compile, compileToFunctions }
 */
