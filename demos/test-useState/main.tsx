import { useState } from 'react';
import ReactDOM from 'react-dom';

const App = () => {
	const [num, setNum] = useState(100);
	window.setNum = setNum;
	return <div>{num}</div>;
};

const root = document.querySelector('#root') as Element;
ReactDOM.createRoot(root).render(<App />);
