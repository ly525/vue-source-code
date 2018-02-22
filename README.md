## What's this? 
> 1. Vue.js 源码阅读，从 `new Vue({})` 开始理解
> 2. vue-cli 中的 `main.js` 做了什么？

### Dev
```bash
npm install
npm run dev # watch src 目录下的代码，并且实时构建生成 dist/vue.js 用于 debug
examples/read-source-code # 里面是用于理解源码的 demo
```

### 说明
> 1. 只用关注 src 目录即可，注释都写在源码中了
> 2. 在 `examples/read-source-code` 中可以自己写一些 demo，来 debug 源码

### vue-cli 生成的 main.js 分析
```javascript
// vue init webpack

import Vue from 'vue'
import App from './App'
import router from './router'
// 以 element-ui 为例
import ElementUI from 'element'

Vue.use(ElementUI)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})

```

1. Vue.use => 「`src/core/global-api/use.js`」
2. 


### Demo
```html
<div id="app">
  <p @click="show">{{text}}</p>
</div>
<script type="text/javascript">
  var vm = new Vue({
    data: {
      text: '要显示的文本'
    },
    methods: {
      show(){
        alert(this.text);
      }
    }
  }).$mount('#app');
</script>
```

```javascript
// 执行过程概览
new Vue(options)
   => this._init(options)
     =>mergeOptions
     =>initLifecycle(vm)
     =>initEvents(vm)
     =>initRender(vm)
     =>callHook(vm, 'beforeCreate')
     =>initInjections(vm)
     =>initState(vm) => 
        => initProps()
        => initMethod() // 将method 挂载到 vm 上
        => initData() => observe(data, true) // 数据代理
        => initComputed()
        => initWatch()
     => vm.$mount(vm.$options.el) // 🌟🌟🌟🌟
     => Vue.prototype.$mount「src/platforms/web/entry-runtime-with-compiler.js」
       => { render, staticRenderFns } = compileToFunctions(template, ...)
         => { compile, compileToFunctions } = createCompiler(baseOptions)
          => parse(template, options)
          => optimize(ast, options)
          => {render, staticRenderFns} = generate(ast, options)
            => code = genElement(ast, state) // code demo: _c('div',{attrs:{"id":"app"}},[_c('p',{on:{"click":show}},[_v(_s(text))])])
              => genData
                => data += `${genHandlers(el.events, false, state.warn)},`
     => mount.call()
      => Vue.prototype.$mount 「src/platforms/web/runtime/index.js」
      => mountComponent
        => updateComponent = function() { vm._update(vm._render(), hydrating) }
        => new Watcher(vm, updateComponent)
          => this.getter = updateComponent
            => this.get()
            => pushTarget
            => value = this.getter.call(vm, vm)
               => vm._update(vm._render(), hydrating)
               => vm._update(Vue.prototype._render())
               => Vue.prototype._update(Vue.prototype._render()) 「src/core/instance/lifecycle.js」
               => vm.__patch__
```
