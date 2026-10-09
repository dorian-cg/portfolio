export const types = {
  isNativeError: (value: unknown): value is Error => value instanceof Error,
};

export default { types };
