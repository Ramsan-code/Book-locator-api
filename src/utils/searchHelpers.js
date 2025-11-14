/**
 * Search and Filter Helper Functions
 * Reusable utilities for building queries across different models
 */

/**
 * Build text search query
 * @param {string} searchTerm - Search term
 * @param {Array} fields - Fields to search in
 * @returns {Object} MongoDB query object
 */
export const buildTextSearch = (searchTerm, fields = []) => {
  if (!searchTerm || fields.length === 0) return {};

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: searchTerm, $options: "i" },
    })),
  };
};

/**
 * Build price range query
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @returns {Object} MongoDB query object
 */
export const buildPriceRange = (minPrice, maxPrice) => {
  const query = {};
  
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }
  
  return query;
};

/**
 * Build date range query
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @param {string} field - Date field name (default: createdAt)
 * @returns {Object} MongoDB query object
 */
export const buildDateRange = (startDate, endDate, field = "createdAt") => {
  const query = {};
  
  if (startDate || endDate) {
    query[field] = {};
    if (startDate) query[field].$gte = new Date(startDate);
    if (endDate) query[field].$lte = new Date(endDate);
  }
  
  return query;
};

/**
 * Build location query (within radius)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in kilometers
 * @returns {Object} MongoDB query object
 */
export const buildLocationQuery = (lat, lng, radius) => {
  if (!lat || !lng || !radius) return {};

  const radiusInRadians = parseFloat(radius) / 6378.1; // Earth radius in km

  return {
    location: {
      $geoWithin: {
        $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians],
      },
    },
  };
};

/**
 * Build near location query (sorted by distance)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} maxDistance - Max distance in meters
 * @returns {Object} MongoDB query object
 */
export const buildNearQuery = (lat, lng, maxDistance = 10000) => {
  if (!lat || !lng) return {};

  return {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseInt(maxDistance),
      },
    },
  };
};

/**
 * Build sort query from string
 * @param {string} sortString - Sort string (e.g., "-price,title")
 * @param {Object} defaultSort - Default sort object
 * @returns {Object} MongoDB sort object
 */
export const buildSort = (sortString, defaultSort = { createdAt: -1 }) => {
  if (!sortString) return defaultSort;

  const sortQuery = {};
  const sortFields = sortString.split(",");

  sortFields.forEach((field) => {
    const trimmedField = field.trim();
    if (trimmedField.startsWith("-")) {
      sortQuery[trimmedField.substring(1)] = -1;
    } else {
      sortQuery[trimmedField] = 1;
    }
  });

  return sortQuery;
};

/**
 * Build pagination object
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {Object} Pagination object { page, limit, skip }
 */
export const buildPagination = (page = 1, limit = 10, maxLimit = 100) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(
    maxLimit,
    Math.max(1, parseInt(limit) || 10)
  );
  const skip = (pageNum - 1) * limitNum;

  return { page: pageNum, limit: limitNum, skip };
};

/**
 * Build enum filter (for single or multiple values)
 * @param {string|Array} values - Value(s) to filter
 * @param {string} field - Field name
 * @returns {Object} MongoDB query object
 */
export const buildEnumFilter = (values, field) => {
  if (!values) return {};

  // Handle comma-separated string
  if (typeof values === "string") {
    const valueArray = values.split(",").map((v) => v.trim());
    return valueArray.length > 1
      ? { [field]: { $in: valueArray } }
      : { [field]: valueArray[0] };
  }

  // Handle array
  if (Array.isArray(values)) {
    return values.length > 1
      ? { [field]: { $in: values } }
      : { [field]: values[0] };
  }

  return { [field]: values };
};

/**
 * Build boolean filter
 * @param {string|boolean} value - Boolean value
 * @param {string} field - Field name
 * @returns {Object} MongoDB query object
 */
export const buildBooleanFilter = (value, field) => {
  if (value === undefined || value === null) return {};

  const boolValue = value === "true" || value === true;
  return { [field]: boolValue };
};

/**
 * Sanitize search input
 * @param {string} input - Search input
 * @returns {string} Sanitized input
 */
export const sanitizeSearchInput = (input) => {
  if (!input) return "";
  
  // Remove special regex characters
  return input
    .toString()
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .substring(0, 100); // Limit length
};

/**
 * Build aggregated query object from request
 * @param {Object} reqQuery - Request query object
 * @param {Object} options - Configuration options
 * @returns {Object} Complete query, sort, and pagination
 */
export const buildCompleteQuery = (reqQuery, options = {}) => {
  const {
    searchFields = [],
    filterFields = [],
    booleanFields = [],
    enumFields = [],
    allowLocation = false,
    defaultSort = { createdAt: -1 },
    maxLimit = 100,
  } = options;

  let query = {};

  // Text search
  if (reqQuery.search && searchFields.length > 0) {
    const sanitized = sanitizeSearchInput(reqQuery.search);
    query = { ...query, ...buildTextSearch(sanitized, searchFields) };
  }

  // Price range
  if (reqQuery.minPrice || reqQuery.maxPrice) {
    query = { ...query, ...buildPriceRange(reqQuery.minPrice, reqQuery.maxPrice) };
  }

  // Date range
  if (reqQuery.startDate || reqQuery.endDate) {
    query = { ...query, ...buildDateRange(reqQuery.startDate, reqQuery.endDate) };
  }

  // Location
  if (allowLocation && reqQuery.lat && reqQuery.lng && reqQuery.radius) {
    query = {
      ...query,
      ...buildLocationQuery(reqQuery.lat, reqQuery.lng, reqQuery.radius),
    };
  }

  // Boolean filters
  booleanFields.forEach((field) => {
    if (reqQuery[field] !== undefined) {
      query = { ...query, ...buildBooleanFilter(reqQuery[field], field) };
    }
  });

  // Enum filters
  enumFields.forEach((field) => {
    if (reqQuery[field]) {
      query = { ...query, ...buildEnumFilter(reqQuery[field], field) };
    }
  });

  // Other filters
  filterFields.forEach((field) => {
    if (reqQuery[field]) {
      query[field] = reqQuery[field];
    }
  });

  // Sort
  const sort = buildSort(reqQuery.sort, defaultSort);

  // Pagination
  const pagination = buildPagination(reqQuery.page, reqQuery.limit, maxLimit);

  return { query, sort, pagination };
};

/**
 * Format search response with metadata
 * @param {Array} data - Result data
 * @param {Object} pagination - Pagination info
 * @param {number} total - Total count
 * @param {Object} appliedFilters - Applied filters
 * @returns {Object} Formatted response
 */
export const formatSearchResponse = (data, pagination, total, appliedFilters = {}) => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    count: data.length,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
    data,
    filters: appliedFilters,
  };
};

/**
 * Extract applied filters from request for response
 * @param {Object} reqQuery - Request query
 * @param {Array} filterKeys - Keys to include in response
 * @returns {Object} Applied filters
 */
export const extractAppliedFilters = (reqQuery, filterKeys = []) => {
  const filters = {};

  filterKeys.forEach((key) => {
    if (reqQuery[key] !== undefined) {
      filters[key] = reqQuery[key];
    }
  });

  // Special handling for common filters
  if (reqQuery.minPrice || reqQuery.maxPrice) {
    filters.priceRange = {
      min: reqQuery.minPrice,
      max: reqQuery.maxPrice,
    };
  }

  if (reqQuery.lat && reqQuery.lng && reqQuery.radius) {
    filters.location = {
      lat: reqQuery.lat,
      lng: reqQuery.lng,
      radius: reqQuery.radius,
    };
  }

  if (reqQuery.startDate || reqQuery.endDate) {
    filters.dateRange = {
      start: reqQuery.startDate,
      end: reqQuery.endDate,
    };
  }

  return filters;
};

export default {
  buildTextSearch,
  buildPriceRange,
  buildDateRange,
  buildLocationQuery,
  buildNearQuery,
  buildSort,
  buildPagination,
  buildEnumFilter,
  buildBooleanFilter,
  sanitizeSearchInput,
  buildCompleteQuery,
  formatSearchResponse,
  extractAppliedFilters,
};