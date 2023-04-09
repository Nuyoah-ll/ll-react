export type Flags = number;

export const NoFlags = 0b0000000;
// 插入
export const Placement = 0b0000001;
// 更新属性
export const Update = 0b0000010;
// 删除子节点
export const ChildDeletion = 0b0000100;

// 代表mutation阶段需要执行的操作
export const MutationMask = Placement | Update | ChildDeletion;
