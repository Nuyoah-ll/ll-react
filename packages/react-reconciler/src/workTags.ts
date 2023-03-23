export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText;

// 表示函数组件
export const FunctionComponent = 0;
// 项目挂载的根节点对应的fiber
export const HostRoot = 3;
// 宿主原生组件：比如浏览器里的div标签
export const HostComponent = 5;
// 文本节点
export const HostText = 6;
