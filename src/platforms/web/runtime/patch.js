/* @flow */

import * as nodeOps from 'web/runtime/node-ops' // nodeOps 封装了许许多多对原生dom操作的方法
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index' // 是web和weex都有的处理，包括directives和ref属性的处理
// src/platforms/web/runtime/modules/transition.js
import platformModules from 'web/runtime/modules/index' // 很明显就是平台相关的一些属性的处理，这里包括transition、attrs、class、domProps、on、style和show。

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)

export const patch: Function = createPatchFunction({ nodeOps, modules })
