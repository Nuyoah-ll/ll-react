import React from 'react';
import ReactDOM from 'react-dom';

const App = () => {
	return (
		<div>
			<A></A>
		</div>
	);
};

const A = () => {
	return <h3>hehe</h3>;
};

console.log(React);
console.log(ReactDOM);
console.log(App);

const root = document.querySelector('#root') as Element;
ReactDOM.createRoot(root).render(<App />);
