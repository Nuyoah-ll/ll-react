// 递归中的递阶段

import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { HostComponent, HostRoot, HostText } from './workTags';

export const beginWork = (wip: FiberNode) => {
	// 比较，返回子fiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip);

		case HostComponent:
			return updateHostComponent(wip);

		case HostText:
			return null;

		default:
			if (__DEV__) console.warn('beginWork未实现的类型');
			return null;
	}
};

//? q 这个得children类型写错了吧？应该是ReactElementType | ReactElementType[]
function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	//? q wip.alternate是在哪里赋值的？
	const current = wip.alternate;
	if (current !== null) {
		// update
		wip.child = reconcileChildFibers(wip, current.child, children);
	} else {
		// mount
		wip.child = mountChildFibers(wip, null, children);
	}
}

// 在mount阶段干两件事：
// 1. 计算状态的最新值
// 2. 创造子fiberNode（通过对比子current fiberNode和子react element来生成子wip fiberNode）
function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memorizedState;
	//? q 这里是mount阶段和更新阶段都是ReactElementType类型的UpdateQueue？
	const updateQueue = wip.updateQueue as UpdateQueue<ReactElementType>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memorizedState } = processUpdateQueue(baseState, pending);
	// 在mount的时候，这里的memorizedState为<App>，这样我们就获取了子fiberNode对应的element
	wip.memorizedState = memorizedState;

	const nextChildren = wip.memorizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

// 由于HostComponent fiber对应的是原生标签 所以无法触发更新，所以只需生成子fiber即可
function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

// HostText类型的节点没有beginWork流程，因为它没有子节点
