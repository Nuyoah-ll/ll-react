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
	return <h3>hehe</h3>;
};

const root = document.querySelector('#root') as Element;
ReactDOM.createRoot(root).render((<App />) as ReactElementType);
