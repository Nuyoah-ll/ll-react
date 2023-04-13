import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
// export type Action<State> = State | ((prevState: State) => State);
// 为什么Action可以是State或者是函数，这是因为无论是setState或者是useState，都可以直接传入一个最新的State或者是传入一个更新State的函数

// 代表更新的数据结构
export interface Update<State> {
	action: Action<State>;
}

// 更新的队列
export interface UpdateQueue<State> {
	shared: {
		// TODO 这里不应该是一个数组?
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

// 创建一个Update
export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action
	};
};

// 创建一个UpdateQueue
export const createUpdateQueue = <State>(): UpdateQueue<State> => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	};
};

// 将Update插入到UpdateQueue中
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	updateQueue.shared.pending = update;
};

/**
 * 对baseState执行UpdateQueue里保存的Update
 * @param baseState 执行Update前的state
 * @param pendingUpdate 将要执行的Update
 * @returns {memorizedState}
 */
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memorizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memorizedState: baseState
	};

	if (pendingUpdate !== null) {
		const action = pendingUpdate.action;
		if (action instanceof Function) {
			// baseState 1 update x => 4x -> memorizedState 4
			result.memorizedState = action(baseState);
		} else {
			// baseState 1 update 2 -> memorizedState 2
			result.memorizedState = action;
		}
	}

	return result;
};
