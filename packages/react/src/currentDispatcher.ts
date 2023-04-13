import { Action } from 'shared/ReactTypes';

export interface Dispatcher {
	//? q useState的第二个参数不应该是(prevState:T) => T吗？
	useState: <T>(initialState: T | (() => T)) => [T, Dispatch<T>];
}

export type Dispatch<State> = (action: Action<State>) => void;

// 当前使用的hooks集合
const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};

export const resolveDispatcher = (): Dispatcher => {
	const dispatcher = currentDispatcher.current;

	if (dispatcher === null) {
		throw new Error('hooks只能在函数组件中执行');
	}
	return dispatcher;
};

export default currentDispatcher;
