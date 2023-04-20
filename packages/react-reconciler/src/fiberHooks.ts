import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { FiberNode } from './fiber';
import internals from 'shared/internals';
import { UpdateQueue, createUpdate, processUpdateQueue } from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { createUpdateQueue } from './updateQueue';
import { enqueueUpdate } from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
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
	// ? 假如是update流程，为啥要将memorizedState赋值为null
	wip.memorizedState = null;

	const current = wip.alternate;

	if (current !== null) {
		// update
		currentDispatcher.current = HooksDispatcherOnUpdate;
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
	workInProgressHook = null;
	currentHook = null;
	return children;
};

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
	// useEffect: mountEffect
};

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
};

function mountState<State>(
	initialState: State | (() => State)
): [State, Dispatch<State>] {
	// 创建当前useState对应的hook数据
	const hook = mountWorkInProgressHook();
	let memorizedState;
	if (initialState instanceof Function) {
		memorizedState = initialState();
	} else {
		memorizedState = initialState;
	}

	// 初始化hook：初始化updateQueue，初始化memorizedState
	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	hook.memorizedState = memorizedState;

	// setState本质上是一个dispatch函数，该函数会关联当前函数组件对应的fiber，以及该useState的updateQueue
	// 当在函数组件中执行了setState后（这里我们并没有处理在挂载的时候就执行setState的逻辑，仅考虑通过事件触发或者其他方式触发比如setTimeout）
	// 我们会用新的action创建一个update并放到当前useState hook的updateQueue上，并且从当前fiber开始调度更新
	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
	// 将dispatch存到当前hook的updateQueue中
	queue.dispatch = dispatch;

	// 在React中，可以在函数外部使用dispatch
	// function A {
	// 	const [x,dispatch] = useState()
	// 	window.dispatch = dispatch
	// }
	// dispatch()

	return [memorizedState, dispatch];
}

function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前useState对应的hook数据
	const hook = updateWorkInProgressHook();

	// 计算新的state的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;

	if (pending !== null) {
		const { memorizedState } = processUpdateQueue(hook.memorizedState, pending);
		hook.memorizedState = memorizedState;
	}

	return [hook.memorizedState, queue.dispatch as Dispatch<State>];
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

/**
 * 在mount阶段，创建hook，并将函数组件中的所有hooks由上到下形成一个链表结构，存储在memorizedState中
 * 在每次renderWithHook函数调用之后，该函数里的workInProgressHook会被重置
 * @returns 当前执行到的hook
 */
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

function updateWorkInProgressHook(): Hook {
	// TODO render阶段触发的更新...
	let nextCurrentHook: Hook | null;
	if (currentHook === null) {
		// 这是这个FC update时的第一个hook
		const current = currentlyRenderingFiber?.alternate;
		if (current !== null) {
			nextCurrentHook = current?.memorizedState;
		} else {
			// mount阶段，mount阶段是不应该进入该函数的，所以这里是一些错误边界的情况
			nextCurrentHook = null;
		}
	} else {
		// 这个FC update时后续的hook
		nextCurrentHook = currentHook.next;
	}

	if (nextCurrentHook === null) {
		// mount时和上一次update时，假如有三个useState，u1,u2,u3
		// 这次update时，假如有四个useState，u1,u2,u3,u4
		// 那么这种情况下回走这个逻辑
		throw new Error(
			`组件${currentlyRenderingFiber?.type}本次执行的hook比上一次执行多`
		);
	}

	currentHook = nextCurrentHook as Hook;

	const newHook = {
		memorizedState: currentHook.memorizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	};
	// mount时的第一个hook
	if (workInProgressHook === null) {
		// 代表着没有在函数组件内调用hooks
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFiber.memorizedState = workInProgressHook;
		}
	} else {
		// mount时后续的hook
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}

	return workInProgressHook;
}
