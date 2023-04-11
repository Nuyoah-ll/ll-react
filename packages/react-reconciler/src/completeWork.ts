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
				// 这里先不考虑属性变化的情况，仅考虑挂载的情况
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

/**
 * 传入wip以及wip对应的DOM元素（parent），将wip下的所有的儿子DOM插入到（parent）中
 * @param parent 当前wip对应的DOM元素
 * @param wip 当前wip
 */
function appendAllChildren(parent: Container, wip: FiberNode) {
	// TODO 这个方法的流程还得捋一捋
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

/**
 * 收集当前fiber的所有子fiber（不单单指fiber.child还有fiber.child的兄弟）的flags以及subTreeFlags。
 * @param wip 当前fiber
 */
function bubbleProperties(wip: FiberNode) {
	let subTreeFlags = NoFlags;
	let child = wip.child;

	while (child !== null) {
		// ? q这种或运算收集子fiber的flags有什么用呢？
		subTreeFlags |= child.subTreeFlags;
		subTreeFlags |= child.flags;
		//? q 这里为什么要完善return链接呢，理论上来讲链接fiber树的工作应该不是在bubbleProperties里完成，而应该在beginWork里完成，先看完后面的多节点beginWork吧，看看能不能找到答案？
		child.return = wip;
		child = child.sibling;
	}

	wip.subTreeFlags |= subTreeFlags;
}
