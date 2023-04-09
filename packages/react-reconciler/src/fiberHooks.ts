import { FiberNode } from './fiber';

export const renderWithHooks = (fiber: FiberNode) => {
	const Component = fiber.type;
	const props = fiber.pendingProps;

	const child = Component(props);
	return child;
};
