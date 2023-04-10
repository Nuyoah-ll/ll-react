import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags } from './fiberFlags';
import { HostRoot } from './workTags';

// 指向当前正在工作的fiber节点
let workInProgress: FiberNode | null = null;

/**
 * 从任意fiber开始，循环往上找，直到找到hostRootFiber并返回fiberRootNode，否则则返回null
 * @param fiber 任意fiber节点
 * @returns FiberRootNode | null
 */
function markUpdateFromFiberToRoot(fiber: FiberNode): FiberRootNode {
	let node = fiber;
	let parent = fiber.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	// 一定存在hostRootFiber，这里没必要判断吧？
	// if (node.tag === HostRoot) {
	// 	return node.stateNode;
	// }
	return node.stateNode;
}

/**
 * 开始调度更新，updateContainer里会调用该方法，表示mount的时候。
 * //? q 后续update的流程，应该也是走这里吧？
 * @param fiber 调度发生时对应的fiber（这里描述不是很准确）
 */
export function scheduleUpdateOnFiber(fiber: FiberNode) {
	// TODO 实现调度功能
	// ...

	// 通过当前fiber向上寻找到FiberRootNode
	//? q 这是否意味着react无论是mount还是update，都从FiberRootNode/hostRootFiber开始？
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
	//? q 当前fiber工作完成之后，将这个fiber的memorizedProps修改为pendingProps。这是因为在beginWork中，会改变pendingProps的值吗？所以才这么赋值
	// 在mount阶段，对于hostRootFiber来说，beginWork并没有改变pendingProps
	// 其他情况，再慢慢debug..
	fiber.memorizedProps = fiber.pendingProps;
	// 表示没有子fiber了，已经遍历到了最深的fiber，这个时候就要开始归阶段了
	//! next debug position
	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling) {
			workInProgress = sibling;
			// 这里return会退出整个函数，不会执行下面的逻辑以及接下来的循环
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
