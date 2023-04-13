import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { FiberNode } from './fiber';
import internals from 'shared/internals';
import { UpdateQueue, createUpdate } from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { createUpdateQueue } from './updateQueue';
import { enqueueUpdate } from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
const { currentDispatcher } = internals;

interface Hook {
	// 对于不同的hook，这个属性保存的数据是不一样的
	// 对于useState来说，这个属性保存着useState的状态
	memorizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export const renderWithHooks = (wip: FiberNode) => {
	// 赋值操作
	currentlyRenderingFiber = wip;
	// 为什么这里要赋值为null呢？因为我们在下面执行函数组件时，要创建hooks链表
	wip.memorizedState = null;

	const current = wip.alternate;

	if (current !== null) {
		// update
	} else {
		// mount
		// 这里就指向了mount时hooks的实现
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = wip.type;
	const props = wip.pendingProps;
	const children = Component(props);
	// 重置操作
	currentlyRenderingFiber = null;
	return children;
};

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

function mountState<State>(
	initialState: State | (() => State)
): [State, Dispatch<State>] {
	// 找到当前useState对应的hook数据
	const hook = mountWorkInProgressHook();
	let memorizedState;
	if (initialState instanceof Function) {
		memorizedState = initialState();
	} else {
		memorizedState = initialState;
	}

	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
	queue.dispatch = dispatch;

	// 在React中，可以在函数外部使用dispatch
	// function A {
	// 	const [x,dispatch] = useState()
	// 	window.dispatch = dispatch
	// }
	// dispatch()

	return [memorizedState, dispatch];
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const update = createUpdate(action);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber);

	// mount时updateContainer下的逻辑
	// const hostRootFiber = root.current;
	// const update = createUpdate<ReactElementType>(element);
	// enqueueUpdate(
	// 	hostRootFiber.updateQueue as UpdateQueue<ReactElementType>,
	// 	update
	// );
	// scheduleUpdateOnFiber(hostRootFiber);
}

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memorizedState: null,
		updateQueue: null,
		next: null
	};
	// mount时的第一个hook
	if (workInProgressHook === null) {
		// 代表着没有在函数组件内调用hooks
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = hook;
			currentlyRenderingFiber.memorizedState = workInProgressHook;
		}
	} else {
		// mount时后续的hook
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}
	return workInProgressHook;
}
