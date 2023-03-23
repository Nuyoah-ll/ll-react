// TODO 完善类型
// TODO Type是干啥的
export type Type = any;
export type ElementType = any;
export type Key = any;
export type Props = any;
export type Ref = any;

export interface ReactElementType {
	$$typeof: symbol | number;
	type: ElementType;
	key: Key;
	props: Props;
	ref: Ref;
	__mark: string;
}

export type Action<State> = State | ((prevState: State) => State);
