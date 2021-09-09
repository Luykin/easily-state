## 🚀easily-state 是一个轻量级的react / vue 全局状态管理库



- easily-state 是对rv-gsm库的升级 (支持react hook / vue3)
- 支持快速读取localStorage,支持加密持久化进localStorage
- 当前对外的方法: init bindData setGlobal getGlobal setGlobalStorage cache
- TODO: 未来支持: 数据过程监控 

##### **⭐️安装**

`yarn add easily-state`

##### **⭐使用**

- init(group: Array<object> | object, config: object) callback
- ...教程完善中,如有需求联系微信： destired

##### **⭐️简单示例**

bindData会监听全局变量的改变,从而改变每一个页面state中的值,第二参数传入this   bindData(key, local)

setGlobal修改全局变量的值 setGlobal(key, value, callback)

getGlobal获取全局变量的值  getGlobal(key)

###### react使用示例:

```
import {bindData, setGlobal} from 'rv-gsm';
export default class Test extends React.Component {  
    constructor(props) {  
        super(props);
        this.state = {  
            userInfo: bindData('userInfo', this), 
        }
    }
    componentDidMount() {
         setTimeout(() => {
            setGlobal('userInfo', {'name': 'luoyukun'}, ()=> {
                console.log(this.state.userInfo);
            })
         }, 1000)
    }
}
```

###### vue使用示例:

```
<template>
  <div>{{ count }}</div>
</template>

<script>

import {bindData} from "rv-gsm"

export default {
  name: "user",
  data() {
    return {
      count: bindData('count', this),
    }
  }
}
</script>
```



##### **⭐️localStorage联合使用**

场景:需要缓存用户信息到网页本地,并随时刷新用户信息,在第一次网络请求还没有拿到用户信息的时候能够展示用户上一次缓存的用户信息

setGlobalStorage(key, value, otherKey)

```
setGlobalStorage('userInfo', {'name': 'luoyukun'});
```

##### **⭐️待完善**

react-native-gsm 链接:-

