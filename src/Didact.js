/* 
...children的扩展运算符保证收集到的参数结果是数组类型
因为children数组中的项可能有原始类型，所以需要createTextElement包一层
*/
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}
// function createDom(fiber) {
//   const dom =
//     fiber.type == "TEXT_ELEMENT"
//       ? document.createTextNode("")
//       : document.createElement(fiber.type);
//   const isProperty = (key) => key !== "children";
//   Object.keys(fiber.props)
//     .filter(isProperty)
//     .forEach((name) => {
//       dom[name] = fiber.props[name];
//     });

//   return dom;
// }
function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}
let nextUnitOfWork = null;
let wipRoot = null; //work in progress root 当前在内存处理中的fiber树根节点
let deletions = null;
//currentRoot始终指向最后一次更新的fiber树(当前页面看到的fiber树)
let currentRoot = null;

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    //alternate联系着旧fiber树中同级节点
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}
//这个函数将在浏览器空闲时期被调用,但是react不用它(因为兼容性和其他问题),react官方自己写了个Scheduler调度器
requestIdleCallback(workLoop);
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}
//这里传入的fiber已经是经过babel转译过的js对象树了，只是现在用performUnitOfWork把原来一次性递归处理dom的操作改为拆分一个个unit单元
//fiber就是原来最开始babel转译的js对象拆分的一个个小单元，经过performUnitOfWork后这些小单元之间有了相互联系构成了fiber树（虚拟DOM），
//多了dom,parent,alternate,effectTag等属性
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  //1,创建当前fiber的DOM;
  //2,创建子fiber（与旧的fiber对比差异再决定如果处理子fiber，首次的话因为没有旧fier那么都是新建fiber节点）
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  //3,返回下一个处理单元;
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}
let wipFiber = null; //work in progress fiber 当前在内存处理中的fiber树
let hookIndex = null; //hooks数组保存当在同一个函数组件中调用多次setState的state,hookIndex保存着当前hook的索引
/* 当一个函数组件里面有不止一个state时，hooks数组和hookIndex就发挥作用了
const [state, setState] = Didact.useState(1);
const [state2, setState2] = Didact.useState(2);
在updateFunctionComponent中，进入执行函数（从上往下走），分别调用两次useState，而hooks数组则保存着这些state，hookIndex用于
在下次进入updateFunctionComponent时在hooks数组中对应读取旧的state用的索引
 */
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = []; //hooks数组保存在同一个函数组件中调用多次setState的state
  // debugger;
  console.log({ fiber });
  //fiber.type是函数,把props作为入参传入，
  //运行它会获得返回值（函数return的jsx被babel转译后的js对象,其中这里babel转译时又会去调用XXX.createElement方法）
  //返回的js对象格式如下
  //   props:{
  //      children:[{type: 'h1', props: {…}},{type: 'h2', props: {…}}]
  //      type: "div"
  // }
  const element = fiber.type(fiber.props);
  const children = [element];
  console.log({ children });
  // debugger;
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  //1,创建当前fiber的DOM;
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  //2,创建子fiber（与旧的fiber对比差异再决定如果处理子fiber）
  reconcileChildren(fiber, fiber.props.children);
}
function reconcileChildren(wipFiber, elements) {
  /*   此方法任务是对比正在创建的新fiber和已有旧fiber的差异，
  来决定是新增子fiber，还是更新子fiber的props，亦或是删除子fiber */
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child; //旧的子fiber节点
  //当为删除子fiber时elements为空数组, oldFiber != null 成立
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;
    //type相同，直接复用旧fiber的dom，并更新下props
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    //新增子fiber节点
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    //删除旧fiber节点
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      //仅新增或更新子fiber时才改变兄弟节点指向
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  let domParentFiber = fiber.parent;
  //对于函数组件，其fiber没有dom，所以需要一直沿着fiber树向上找
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}
const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
function updateDom(dom, prevProps, nextProps) {
  //删除旧属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });
  //新增或更新属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });
  //新增事件监听
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
  //删除或更新事件监听
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
}
const Didact = {
  createElement,
  render,
  useState,
};

export default Didact;

//最简单的render方法
/* function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);
  const isProperty = (key) => key !== "children";
  //将React元素的props属性赋给生成的dom节点
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });
  //递归出口是没有子元素，即children为空数组
  element.props.children.forEach((child) => render(child, dom));
  container.appendChild(dom);
} */
