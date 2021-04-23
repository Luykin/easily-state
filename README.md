## 🚀rv-gsm是一个轻量级的react/vue全局状态管理库

- 简化initGlobal调用，initGlobal第一个参数initial为全局变量，变量名称以__来头的意味需要本地化存储,第二参数为网站版本号，尽量遵循在网站大更新需要清除本地缓存时更换此参数
- 对本地存储进行加密

##### **⭐️安装**

`yarn add rv-gsm`

##### **⭐️初始化**

请尽可能提前初始化,rv-gsm会在浏览器localStorage中主动取出键值对存储全局变量中

```
import {initGlobal} from 'rv-gsm';

const defaultGlobal = {  __userInfo: null,  __token: null, other: '...' };

initGlobal(defaultGlobal);
```

##### **⭐️简单使用**

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

