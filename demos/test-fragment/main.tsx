import { useState } from 'react';
import ReactDOM from 'react-dom';
import { ReactElementType } from 'shared/ReactTypes';

const App = () => {
	return (
		<div onClick={() => console.log('哈哈哈')}>
			<A></A>
		</div>
	);
};

const child = (
	<>
		<div>1</div>
		<div>2</div>
		<div>3</div>
	</>
);

const child1 = (
	<ul>
		<>
			<li>1</li>
			<li>2</li>
		</>
		<li>3</li>
		<li>4</li>
	</ul>
);

const child2 = [<div>a</div>, <div>b</div>, <div>c</div>];

const A = () => {
	const [num, setNum] = useState(100);
	return (
		<h3 onClick={() => setNum(num + 1)}>
			{child}
			{child1}
			{child2}
		</h3>
	);
};

const root = document.querySelector('#root') as Element;
ReactDOM.createRoot(root).render((<App />) as ReactElementType);
