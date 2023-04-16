import { ReactElementType } from 'shared/ReactTypes';
// @ts-ignore
import { createRoot } from 'react-dom';

export const renderInfoContainer = (element: ReactElementType) => {
	const div = document.createElement('div');
	createRoot(div).render(element);
};
