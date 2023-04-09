import {
	Container,
	Instance,
	appendInitialChild,
	createInstance,
	createTextInstance
} from 'hostConfig';
import { FiberNode } from './fiber';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { NoFlags } from './fiberFlags';
// 递归中的归阶段
export const completeWork = (wip: FiberNode) => {
	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update 这种情况不做处理
			} else {
				// 首屏渲染
				// 1.构建DOM
				// const instacne = createInstance(wip.type, newProps);
				const instacne = createInstance(wip.type);
				// 2.将DOM插入到离屏DOM树种
				appendAllChildren(instacne, wip);
				wip.stateNode = instacne;
			}
			bubbleProperties(wip);
			return null;

		case HostText:
			if (current !== null && wip.stateNode) {
				// update 这种情况不做处理
			} else {
				// 首屏渲染
				// 1.构建DOM
				const instacne = createTextInstance(newProps.content);
				wip.stateNode = instacne;
			}
			bubbleProperties(wip);
			return null;

		case HostRoot:
			bubbleProperties(wip);
			return null;

		case FunctionComponent:
			bubbleProperties(wip);
			return null;

		default:
			if (__DEV__) {
				console.warn('未处理的completeWork情况', wip);
			}
			return null;
	}
	// TODO
	return null;
};

//? q 这里的parent不是一个fiberNode，而是一个真实DOM
function appendAllChildren(parent: Container, wip: FiberNode) {
	let node = wip.child;

	// B

	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node.stateNode);
		} else if (node.child !== null) {
			//? q 这里为什么要多此一举保持链接呢
			node.child.return = node;
			node = node.child;
			continue;
		}

		// ? q 为什么终止条件是这个
		if (node === wip) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return;
			}

			node = node?.return;
		}

		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function bubbleProperties(wip: FiberNode) {
	const subTreeFlags = NoFlags;
	let child = wip.child;

	while (child !== null) {
		subTreeFlags != child.subTreeFlags;
		subTreeFlags != child.flags;

		child.return = wip;
		child = child.sibling;
	}

	wip.subTreeFlags != subTreeFlags;
}
