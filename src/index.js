import "./index.css";
import Didact from "./Didact";
import didact_copy from "./didact_copy";
console.log("begin");
//没用函数组件前的
//下面两行用于告诉Babel用我们的Didact.createElement而不是默认的React.createElement
/** @jsxRuntime classic */
/** @jsx Didact.createElement */
// const element = (
//   <div style="background: salmon">
//     <h1>
//       <span>Text in span</span>
//     </h1>
//     <h2 style="text-align:right">from Didact</h2>
//     onlyText
//   </div>
// );
// console.log({ element });
// Didact.render(element, document.getElementById("root"));
// 1，babel会从最内层的标签开始进入（这里就是span标签），然后自动帮我们收集好入参并调用createElement方法，返回处理好的js对象；
// babel帮忙收集的入参格式如下:
// {
//   type:"h2",
//   props:{
//     style: "text-align:right",
//     __self: undefined,
//     __source: {...}
//   },
// ...Children:["from Didact"]
// }
//若走到div时，入参会如下:
// {
//   type:"div",
//   props:{
//     style: "background: salmon",
//     __self: undefined,
//     __source: {...}
//   },
// ...Children:[{type:"h1",props:{...},{type:"h2",props:{...}},]
// }
// 2，然后继续进入h1标签，并帮我们处理好入参（这时候的...children会有上一步处理好的span标签的js对象）；
// 3，然后继续进入h2标签直到最后进入最外层div标签完成整个js对象树的创建.
// 4，返回值是 element:{
//   props:{
//     children: (3) [{…}, {…}, {…}],
//     style: "background: salmon"
//   }
//   type: "div"
// }

//下面是函数组件
/** @jsxRuntime classic */
/** @jsx Didact.createElement */
function Counter(props) {
  const [state, setState] = Didact.useState(1);
  const [state2, setState2] = Didact.useState(2);
  return (
    <div>
      <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>
      <h1 onClick={() => setState2((c) => c + 2)}>Count: {state2}</h1>
    </div>
  );

  // const { name } = props;
  // return (
  //   <div>
  //     <h1>just {name}</h1>
  //     <h2>
  //       <span>in span</span>
  //     </h2>
  //   </div>
  // );
}
//1,Babel会帮我们收集props属性放到一个对象中格式如下:
/* props:{
  name:"weison"
} */

//2,Babel帮我们调用Didact.createElement(type, props, ...children)方法，并帮我们整理好入参(参数如下)
// type:ƒ Counter(props)
// props:{
//   name: "weison"
// }
//...children:[]
//3,createElement返回的js对象如下:
// {
//   props: {name: 'weison', children:[]}
//   type: ƒ Counter(props)
// }
const element = <Counter name="weison"></Counter>;
console.log({ element });
//3,继续往下走调用render方法,从root根节点进入，render执行完毕后 nextUnitOfWork = wipRoot;完成首次fiber节点赋值
Didact.render(element, document.getElementById("root"));
//4,下一步浏览器会在空闲时调用requestIdleCallback
//5,进入workLoop调用performUnitOfWork传入根fiber，
//此时创建的子fiber是传入render的element，即Babel转译的Counter jsx组件
