/**
 * Pagination utility function
 * @param {Object} query - Mongoose query object
 * @param {Object} options - Pagination options
 * @param {number} options.page - Current page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {Object} options.sort - Sort object (default: { createdAt: -1 })
 * @param {Object} options.select - Fields to select
 * @param {Object} options.populate - Fields to populate
 * @returns {Promise<Object>} Paginated results
 */
export const paginate = async (query, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };

  // Build query
  let mongoQuery = query.skip(skip).limit(limit).sort(sort);

  // Apply select if provided
  if (options.select) {
    mongoQuery = mongoQuery.select(options.select);
  }

  // Apply populate if provided
  if (options.populate) {
    mongoQuery = mongoQuery.populate(options.populate);
  }

  // Execute query and count
  const [results, total] = await Promise.all([
    mongoQuery.exec(),
    query.model.countDocuments(query.getFilter()),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    results,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
  };
};

/**
 * Extract pagination parameters from request query
 * @param {Object} reqQuery - Express request query object
 * @returns {Object} Pagination options
 */
export const getPaginationParams = (reqQuery) => {
  return {
    page: parseInt(reqQuery.page) || 1,
    limit: parseInt(reqQuery.limit) || 10,
    sort: reqQuery.sort
      ? JSON.parse(reqQuery.sort)
      : { createdAt: -1 },
  };
};

/**
 * Create pagination response object
 * @param {Array} data - Data array
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total count
 * @returns {Object} Formatted pagination response
 */
export const paginationResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    count: data.length,
    total,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    data,
  };
};

export default paginate;