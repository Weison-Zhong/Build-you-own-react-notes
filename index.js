import Didact from "./didact_copy";

/** @jsxRuntime classic */
/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1);
  const [show, setShow] = Didact.useState(true);
  function change() {
    console.log("change");
    setShow(() => !show);
  }
  return (
    <div>
      <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>
      <button onClick={change}>++++</button>
      {show ? <div>newdiv</div> : null}
    </div>
  );
}
// const element = <Counter />;

const container = document.getElementById("root");
Didact.render(<Counter />, container);
