import React from 'react';
import ReactDOM from 'react-dom';

const App = () => {
	return (
		<div>
			<span>llreact</span>
		</div>
	);
};

console.log(React);
console.log(ReactDOM);
console.log(App);

const root = document.querySelector('#root') as Element;
ReactDOM.createRoot(root).render(<App />);
