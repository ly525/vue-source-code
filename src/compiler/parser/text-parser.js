/* @flow */

import { cached } from 'shared/util'
import { parseFilters } from './filter-parser'

// 找到 {{abc}} 这样的, .+ 的意义是最小匹配, 找到符合的马上结束
const defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g

// 正则的元字符  ^ $ . * + ? = ! : | \ / ( ) [ ] { }
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g

// 创建用户自定义模板符号, 比如传入 [  "[[", "]]" ], 模板就可以写成 [[abc.reverse()]]. 用于解决和后端模板符号冲突
const buildRegex = cached(delimiters => {
  const open = delimiters[0].replace(regexEscapeRE, '\\$&')
  const close = delimiters[1].replace(regexEscapeRE, '\\$&')
  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
})

export function parseText (
  text: string,
  delimiters?: [string, string]
): string | void {
  // 拿到最终的模板正则
  const tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE
  if (!tagRE.test(text)) {
    return
  }
  const tokens = []
  let lastIndex = tagRE.lastIndex = 0
  let match, index
  while ((match = tagRE.exec(text))) {
    index = match.index
    // push text token
    if (index > lastIndex) {
      tokens.push(JSON.stringify(text.slice(lastIndex, index)))
    }
    // tag token
    const exp = parseFilters(match[1].trim())
    tokens.push(`_s(${exp})`)
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) {
    tokens.push(JSON.stringify(text.slice(lastIndex)))
  }
  return tokens.join('+')
}
