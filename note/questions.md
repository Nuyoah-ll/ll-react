### 为什么写 React 组件的时候，需要先引入 React？

因为在 React 17 的 RC 版本之前，jsx 经过 babel 编译之后，会变成 React.createElement 的函数调用，如果在文件内不引入 React，则会报错找不到 React。

而在 React 17 RC 版本及之后，React 和 Babel 合作，发布了全新的 jsx 转换方式，在源码中新增了`jsx`和`jsxDEV`方法并分别在 `React/jsx-runtime.js`和`React/jsx-dev-runtime.js`导出。这样当 Babel 对 jsx 进行编译的时候，会自动引入这两个包的 jsx 方法，并将 jsx 编译为 jsx 函数的调用形式。所以就不需要我们手动引入 React 了。

进入[Babel 官网](https://babeljs.io/)，我们可以选择 React runtime 分别为`Classic`和`Automatic`，前者是旧版的 React.createElement 调用，后者是新版的 jsx 调用。

以下面这一段 jsx 来举例，Babel 在这两种 runtime 下编译后的结果（去掉``注释）

```jsx
<App id="app" onClick={add} ref={ref}>
	<h2 class="title" key="titleKey">
		Title
	</h2>
	<p>
		<div></div>
	</p>
	<></>
	Pure Text
</App>
```

**Classic**

```javascript
React.createElement(
	App,
	{
		id: 'app',
		onClick: add,
		ref: ref
	},
	React.createElement(
		'h2',
		{
			class: 'title',
			key: 'titleKey'
		},
		'Title'
	),
	React.createElement('p', null, React.createElement('div', null)),
	React.createElement(React.Fragment, null),
	'Pure Text'
);
```

**Automatic**

```javascript
import { jsx as _jsx } from 'react/jsx-runtime';
import { Fragment as _Fragment } from 'react/jsx-runtime';
import { jsxs as _jsxs } from 'react/jsx-runtime';
_jsxs(App, {
	id: 'app',
	onClick: add,
	ref: ref,
	children: [
		_jsx(
			'h2',
			{
				class: 'title',
				children: 'Title'
			},
			'titleKey'
		),
		_jsx('p', {
			children: _jsx('div', {})
		}),
		_jsx(_Fragment, {}),
		'Pure Text'
	]
});
```

- [ ] React.CreateElement 和 jsx 方法有什么区别？
- [ ] jsx、jsxs、jsxDEV 又分别有什么区别？

### 说说 jsx 或者 React.createElement 方法

jsx 和 createElement 方法会返回一种叫做 ReactElement 的数据结构，ReactElement 同时也是一个方法，jsx 和 createElement 方法会返回 ReactElement 方法的调用生成 ReactElement。
也就是说 jsx 和 createElement 主要是预处理一些数据，并将这些预处理数据交由 ReactElement 方法生成 ReactElement。

**ReactElement 方法**
ReactElement 方法接受 `type`、`key`、`ref`、`props` 参数，内部创建一个 `element` 对象，将这些参数放到 `element` 对象上，并加上一些额外的参数，然后返回 `element`

```typescript
const ReactElement = function (
	type: Type,
	key: Key,
	ref: Ref,
	props: Props
): ReactElementType {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__mark: 'KaSong'
	};
	return element;
};
```

**createElement**

```typescript
const createElement = (
	type: ElementType,
	config: any,
	...maybeChildren: any
) => {
	// 预处理，包括如下步骤：
	// 0. 定义key、ref和props变量
	// 1. 遍历config参数，从里面将key和ref单独拿出来，并将其他属性放到props上
	// 2. 处理children，将其赋值给props.children。如果children只有一个，那么props.children就是该child ReactElement对象，如果children有多个，则props.children是一个数组
	return ReactElement(type, key, ref, props);
};
```

**jsx**

```typescript
const jsx = (type: ElementType, config: any, maybeKey: any) => {
	// 预处理，包括如下步骤：
	// 0. 定义key、ref和props变量
	// 1. 将maybeKey复制给key
	// 2. 遍历config参数，从里面将key和ref单独拿出来，并将其他属性放到props上。如果存在key，则覆盖之前的mayKey，如果不存在，则key任然保持之前的maybeKey
	return ReactElement(type, key, ref, props);
};
```

可以发现 jsx 相比较与 createElement，不需要再处理 children 了，因为在 Babel 以 Automatic runtime 编译时，会将 children 作为 config 的一个参数传给 jsx 函数（注意：与 ReactElement 一样，如果 children 只有一个，那么这个属性为一个对象，如果有多个，则为一个数组）。除此之外，jsx 还多个 maybeKey 参数，特殊处理 key 值，在 Babel 以 Automatic runtime 编译时，key 值会作为 jsx 函数的一个参数单独传入。

- [ ] ReactElement 上的额外参数有哪些，分别有什么作用（比如：`$$typeof`等）？
