export const parsePagination = (
  query = {},
  { defaultPage = 1, defaultLimit = 12, maxLimit = 60 } = {},
) => {
  const page = Math.max(1, parseInt(query.page, 10) || defaultPage);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(query.limit, 10) || defaultLimit),
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPaginationMeta = ({ page, limit, total }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const paginateArray = (items = [], { page, limit, skip }) => {
  const total = items.length;
  const data = items.slice(skip, skip + limit);
  return {
    data,
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};
