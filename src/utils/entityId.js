const isPrimitiveId = (value) =>
  typeof value === 'string' || typeof value === 'number';

export const getComparableEntityId = (value, seen = new Set()) => {
  if (value == null) {
    return '';
  }

  if (isPrimitiveId(value)) {
    return String(value);
  }

  if (typeof value !== 'object') {
    return '';
  }

  if (seen.has(value)) {
    return '';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = getComparableEntityId(entry, seen);
      if (resolved) {
        return resolved;
      }
    }
    return '';
  }

  const candidate =
    value._id ??
    value.id ??
    value.productId ??
    value.slug ??
    value.productslug ??
    value.product ??
    value.item ??
    null;

  return candidate == null ? '' : getComparableEntityId(candidate, seen);
};
