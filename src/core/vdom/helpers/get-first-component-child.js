/* @flow */

import { isDef } from 'shared/util'
import { isAsyncPlaceholder } from './is-async-placeholder'

/**
 * @param children
 * @returns {VNode}
 * 过滤掉非自定义的标签，然后获取第一个自定义标签所对应的vnode。
 * 所以，如果keep-alive里面包裹的是html标签，是不会渲染的。
 */
export function getFirstComponentChild (children: ?Array<VNode>): ?VNode {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      const c = children[i]
      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c
      }
    }
  }
}
