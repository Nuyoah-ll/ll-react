import { useState } from 'react';
import ReactDOM from 'react-dom';
import { ReactElementType } from 'shared/ReactTypes';

const App = () => {
	return (
		<div>
			<A></A>
		</div>
	);
};

const A = () => {
	const [num, setNum] = useState(100);
	return (
		<h3 onClick={() => setNum(num + 1)}>{num % 2 === 0 ? 'hehe' : num}</h3>
	);
};

const root = document.querySelector('#root') as Element;
ReactDOM.createRoot(root).render((<App />) as ReactElementType);
