import { useState } from 'react';
import ReactDOM from 'react-dom';

const App = () => {
	const [num] = useState(100);
	return <div>{num}</div>;
};

const root = document.querySelector('#root') as Element;
ReactDOM.createRoot(root).render(<App />);
