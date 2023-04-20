import { Container } from 'hostConfig';
import { Props } from 'shared/ReactTypes';

export const elementPropsKey = '__props';
const validEventTypeList = ['click'];

export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}

type EventCallback = (e: Event) => void;

interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}

interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}

/**
 * 在mount时createInstance阶段、update时completeWork里，会调用该方法，为wip fiber对应的DOM元素添加一个__props属性用于存放wip fiber上对应的pendingProps(这个pendingProps会在创建fiber时通过createFiberFromElement方法里来的)
 * 这些props里就包含了在元素上监听的onClick属性
 * @param node wip fiber对应的DOM元素
 * @param props wip fiber上的pendingProps
 */
export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}

/**
 * ReactDOM.createRoot(root).render(element)的render函数中会调用该方法
 * 该方法会给container(也就是根元素，不再是document的了)绑定对应的事件，并且在事件回调中调用dispatchEvent方法
 * @param container 根元素
 * @param eventType 事件名称，目前我们暂时只是实现了click事件
 */
export function initEvent(container: Container, eventType: string) {
	if (!validEventTypeList.includes(eventType)) {
		console.warn('当前不支持', eventType, '事件');
		return;
	}

	if (__DEV__) {
		console.log('初始化事件', eventType);
	}

	container.addEventListener(eventType, (e) => {
		console.log('触发了container的click事件', e);
		dispatchEvent(container, eventType, e);
	});
}

/**
 * 目前实现的功能：1.为原始DOM事件对象添加__stopPropagation属性，并且覆盖原始DOM事件对象的stopPropagation方法
 * TODO 还需要实现更多功能
 * @param e 原始事件对象
 * @returns 合成事件
 */
function createSyntheticEvent(e: Event) {
	const syntheticEvent = e as SyntheticEvent;
	syntheticEvent.__stopPropagation = false;
	const originStopPropagation = e.stopPropagation;
	syntheticEvent.stopPropagation = () => {
		syntheticEvent.__stopPropagation = true;
		if (originStopPropagation) {
			originStopPropagation();
		}
	};
	return syntheticEvent;
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
	// 触发该事件的目标元素
	const targetElement = e.target;
	if (targetElement === null) {
		console.warn('事件不存在target', e);
	}
	// 1.收集targetElement到container之间的所有DOM Element中对应的事件回调
	const { bubble, capture } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	);
	// 2.构造合成事件
	const se = createSyntheticEvent(e);
	console.log(bubble, capture, se);
	//? q 目前看来这个版本无法“自动”阻止冒泡，子node的onClick事件会使得父node的也执行，react真实项目也是这样吗？
	// 3.遍历capture
	triggerEventFlow(capture, se);

	// 如果在capture的回调函数中使用了se.stopPropagation()
	// 那么__stopPropagation为true，就不会触发冒泡
	if (!se.__stopPropagation) {
		// 4.遍历bubble
		triggerEventFlow(bubble, se);
	}
}

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i];
		callback.call(null, se);

		// 如果在某个onClick事件中调用了se.stopPropagation()，将se.__stopPropagation置位true
		// 则不会冒泡
		if (se.__stopPropagation) {
			break;
		}
	}
}

function getEventCallbackNameFromEventType(
	eventType: string
): string[] | undefined {
	return {
		click: ['onClickCapture', 'onClick']
		// scroll: ['onScroll', 'onScrollCapture']
		// ...
	}[eventType];
}

function collectPaths(
	targetElement: DOMElement,
	container: Container,
	eventType: string
) {
	const paths: Paths = {
		capture: [],
		bubble: []
	};

	while (targetElement && targetElement !== container) {
		// 收集
		const elementProps = targetElement[elementPropsKey];
		if (elementProps) {
			const callbackNameList = getEventCallbackNameFromEventType(eventType);
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					const eventCallback = elementProps[callbackName];
					// 如果DOM上绑定了onClick或者onClickCapture，那么将这些事件的回调函数添加到paths中
					if (eventCallback) {
						if (i === 0) {
							paths.capture.unshift(eventCallback);
						} else {
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}
		targetElement = targetElement.parentNode as DOMElement;
	}

	return paths;
}
