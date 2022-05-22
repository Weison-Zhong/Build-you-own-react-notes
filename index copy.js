import "./index.css";
import Didact from "./Didact";
// let show = false;
//下面两行用于告诉Babel用我们的Didact.createElement而不是默认的React.createElement
/** @jsxRuntime classic */
/** @jsx Didact.createElement */
const element = (
  <div style="background: salmon">
    <h1>
      <span>Text in span</span>
    </h1>
    <h2 style="text-align:right">from Didact</h2>
    onlyText
    <button>加加加</button>
    {/* {show ? <div>newdiv</div> : null} */}
  </div>
);

// function add() {
//   show = false;
// }

console.log({ element });
Didact.render(element, document.getElementById("root"));
