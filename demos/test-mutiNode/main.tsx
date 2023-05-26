import { useState } from 'react';
import ReactDOM from 'react-dom';
import { ReactElementType } from 'shared/ReactTypes';

const App = () => {
	const [num, setNum] = useState(100);
	const arr = num % 2 === 0 ? [1, 2, 3] : [3, 2, 1];
	return (
		<ul onClick={() => setNum(num + 1)}>
			{arr.map((item) => (
				<li key={item}>{item}</li>
			))}
		</ul>
	);
};

const root = document.querySelector('#root') as Element;
ReactDOM.createRoot(root).render((<App />) as ReactElementType);
