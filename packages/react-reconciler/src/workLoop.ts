import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags } from './fiberFlags';
import { HostRoot } from './workTags';

// 指向当前正在工作的fiber节点
let workInProgress: FiberNode | null = null;

// 从任意fiber开始，循环往上找，直到找到hostRootFiber并返回，否则则返回null
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = fiber.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
	// TODO 调度功能
	const root = markUpdateFromFiberToRoot(fiber);
	renderRoot(root);
}

function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
}

// 完成初始化操作并循环调用workLoop。判断判断条件是true，这样的死循环不会有什么问题吗？？
// 调用renderRoot用于更新，而react常见的触发更新的方式有：ReactDOM.createRoot().render、 this.setState、useState的dispatch方法
function renderRoot(root: FiberRootNode) {
	// 初始化
	prepareFreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			if (__DEV__) console.warn('workLoop发生错误', e);
			workInProgress = null;
		}
	} while (true);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;

	// 根据wip Fiber tree执行对应的DOM操作
	commitWork(root);
}

function commitWork(root: FiberRootNode) {
	const finishedWork = root.finishedWork;

	if (finishedWork === null) {
		return;
	}

	if (__DEV__) {
		console.warn('commit阶段开始');
	}

	root.finishedWork = null;

	// 判断是否存在3个子阶段需要执行的操作
	// 判断root本身的flags和root的subtree flags
	const subTreeHasEffect =
		(finishedWork.subTreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subTreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation（主要实现这个阶段 Placement相关的操作）
		commitMutationEffects(finishedWork);
		// mutation阶段完成，layout阶段开始之前完成fiber树的切换
		root.current = finishedWork;

		// layout
	} else {
		root.current = finishedWork;
	}
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	// 递阶段，beginWork会返回当前fiber的子fiber，next也就是子fiber
	const next = beginWork(fiber);
	// TODO 当前fiber工作完成之后，将这个fiber的memorizedProps修改为pendingProps。这是因为在benginWork中，会改变pendingProps的值吗？所以才这么赋值
	fiber.memorizedProps = fiber.pendingProps;
	// 表示没有子fiber了，已经遍历到了最深的fiber，这个时候就要开始归阶段了
	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	do {
		// 两点问题：
		// 1. 按照现在这么个逻辑，所有的fiber节点都会被执行beginWork和completeWork
		// 2. 终止循环不能使用return，在do...while循环中执行return会报错:Illegal return statement
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			//
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
