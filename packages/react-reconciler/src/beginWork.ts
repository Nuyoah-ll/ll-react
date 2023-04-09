// 递归中的递阶段

import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { renderWithHooks } from './fiberHooks';

export const beginWork = (wip: FiberNode) => {
	// 比较，返回子fiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip);

		case HostComponent:
			return updateHostComponent(wip);

		// hostText类型的fiber没有子节点，不需要进行任何操作，直接返回null即可
		case HostText:
			return null;

		case FunctionComponent:
			return updateFunctionComponent(wip);

		default:
			if (__DEV__) console.warn('beginWork未实现的类型');
			return null;
	}
};

//? q 这个得children类型写错了吧？应该是ReactElementType | ReactElementType[]
function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	//? q 除了hostRootFiber，wip.alternate是在哪里赋值的？
	const current = wip.alternate;
	// 首次渲染只有一个节点会走update，那就是hostRootFiber。看后续代码就会发现，这样会给<App />对应的wip fiber加上Placement标记
	// 如果走mountChildFibers，那么<App /> 对应的wip fiber上不会有Placemen标记
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

function updateFunctionComponent(wip: FiberNode) {
	const nextChildren = renderWithHooks(wip);
	reconcileChildren(wip, nextChildren);
	return wip.child;
}
