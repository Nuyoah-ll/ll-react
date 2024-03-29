import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';
import {
	createElement as createElementFn,
	isValidElement as isValidElementFn
} from './src/jsx';

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

// 内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

// TODO 17之后的react还是会返回createElement? 如果是的话是jsxDEV还是jsx
export const version = '0.0.0';
// TODO 根据环境区分使用jsx还是jsxDEV
export const createElement = createElementFn;
export const isValidElement = isValidElementFn;
