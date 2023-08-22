import { Key, Props, ReactElementType, Ref } from 'shared/ReactTypes';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	WorkTag
} from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';

export class FiberNode {
	// TODO 这个type和ReactElement的type是一样的吗
	type: any;
	key: Key;
	ref: Ref;
	// tag表示fiberNode是什么类型的Fiber，包括函数组件、宿主根节点、宿主元素、宿主文本
	tag: WorkTag;
	// 对于HostComponent来说，<div> 这个实例属性保存的是div DOM？
	// 对于HostRootFiber来说，这个属性指向FiberRootNode，那么是否意味着FiberRootNode也是一个真实DOM，如果不是，那是不是其他类型的fiber stateNode值实际上始终为null
	stateNode: any;

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	// 同级fiberNode下的索引值
	index: number;

	// pendingProps表示这个工作单元刚开始工作的时候，节点props值
	pendingProps: Props;
	// 工作完成之后，确定下来的props值
	memorizedProps: Props;
	//! 对于FunctionComponent来说，该属性保存了一条hooks链表
	memorizedState: any;
	// 用于current FiberNode树和wip FiberNode树之前进行切换，比如当前fiberNode是current，那么alternate指向workInProgress，反之同理
	// current fiberNode树是指与真实UI对应的fiber树，wip树是指触发更新之后，正在reconcile中的fiber树
	// currentFiber.alternate === workInProgressFiber;
	// workInProgressFiber.alternate === currentFiber;
	alternate: FiberNode | null;
	// 副作用
	flags: Flags;
	subTreeFlags: Flags;
	// TODO 完成类型定义
	updateQueue: unknown;
	deletions: FiberNode[] | null;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.ref = null;
		this.type = null;
		this.key = key || null;
		this.tag = tag;
		this.stateNode = null;

		// 构成树状结构
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		// 作为工作单元
		this.pendingProps = pendingProps;
		this.memorizedProps = null;
		this.memorizedState = null;
		this.alternate = null;
		this.flags = NoFlags;
		this.subTreeFlags = NoFlags;
		this.updateQueue = null;
		this.deletions = null;
	}
}

// 之所以要区分fiberRootNode与rootFiber，是因为在应用中我们可以多次调用ReactDOM.render渲染不同的组件树，他们会拥有不同的rootFiber。
// 但是整个应用的根节点只有一个，那就是fiberRootNode。
// fiberRootNode的current会指向当前页面上已渲染内容对应Fiber树，即current Fiber树。
export class FiberRootNode {
	// 宿主环境下根节点的真实DOM
	container: Container;
	// 指向current hostRootFiber
	current: FiberNode;
	// 指向更新完成以后的hostRootFiber，也就是完成递归流程的hostRootFiber
	finishedWork: FiberNode | null;

	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;
	if (wip === null) {
		// mount
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;

		wip.alternate = current;
		current.alternate = wip;
	} else {
		// TODO update
		//? q update阶段，为什么要进行这些以及下面的这些操作（实现了update逻辑之后看看）
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags;
		wip.subTreeFlags = NoFlags;
		wip.deletions = null;
	}
	//? q 如果是mount阶段，下面除了updateQueue其实没有必要再赋值了吧？
	wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.flags = current.flags;
	wip.child = current.child;
	wip.memorizedProps = current.memorizedProps;
	wip.memorizedState = current.memorizedState;
	return wip;
};

/**
 * 根据element创建fiber，element只会是宿主原生元素或者是函数组件
 * @param element react element
 * @returns 这个element对应的fiber
 */
export function createFiberFromElement(element: ReactElementType): FiberNode {
	const { type, key, props } = element;
	// FunctionComponent | HostComponent
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === 'string') {
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('未实现的type类型', type);
	}

	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	return fiber;
}

export function createFiberFromFragment(elements: any[], key: Key) {
	const fiber = new FiberNode(Fragment, elements, key);
	return fiber;
}
