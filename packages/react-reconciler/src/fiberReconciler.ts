import { Container } from 'hostConfig';
import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';
import { HostRoot } from './workTags';

/**
 * 调用React.createRoot(rootElement)时，内部便是调用createContainer(rootElement)方法。该方法传入一个宿主根元素，进行如下操作：
 * 1. 为宿主根元素创建其对应的hostRootFiber，tag类型为HostRoot
 * 2. 创建FiberRootNode，并建立它与hostRootFiber的连接
 * 3. 为hostRootFiber添加一个空的updateQueue
 * @param container 宿主根元素
 * @returns FiberRootNode
 */
export function createContainer(container: Container) {
	// hostRootFiber代表”hostRoot对应的fiberNode“，在浏览器环境下hostRoot即rootElement，即那个root = document.querySelector('#root')
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	// 创建FiberRootNode，它负责管理该应用的全局事宜，比如：current fiber tree与wip fiber tree之间的切换等
	const root = new FiberRootNode(container, hostRootFiber);
	// 为hostRootFiber添加一个空的更新队列
	//? q 为什么要在这里加一下？
	hostRootFiber.updateQueue = createUpdateQueue();
	return root;
}

/**
 * 为hostRootFiber的updateQueue增加{ action: element }，然后便开始调度更新（传入hostRootFiber）
 * @param element 任意React Element，一般是<App />
 * @param root FiberRootNode
 * @returns element本身
 */
export function updateContainer(
	element: ReactElementType,
	root: FiberRootNode
) {
	const hostRootFiber = root.current;
	const update = createUpdate<ReactElementType>(element);
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType>,
		update
	);
	// 上述步骤完成之后：
	// hostRootFiber.updateQueue = {
	// 	shared: {
	// 		pending: {
	// 			action: element
	// 		}
	// 	}
	// };
	//? q 为什么要这么做？仅仅只是hostRootFiber这么干吗？
	// 开始调度更新
	scheduleUpdateOnFiber(hostRootFiber);
	return element;
}
