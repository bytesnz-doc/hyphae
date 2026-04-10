/** Filter operators supported in filter[path][$op]=value query params. */
export type FilterOperator =
  | '$eq'
  | '$lt'
  | '$gt'
  | '$lte'
  | '$gte'
  | '$in'
  | '$has'
  | '$like'
  | '$ilike'
  | '$fuzzy'
  | '$starts'
  | '$ends';

/** A single field-level filter condition. */
export interface FilterCondition {
  type: 'condition';
  path: string;
  operator: FilterOperator;
  value: unknown;
}

/** Logical combinator wrapping multiple sub-expressions. */
export interface FilterAnd {
  type: 'and';
  filters: FilterExpression[];
}

export interface FilterOr {
  type: 'or';
  filters: FilterExpression[];
}

export interface FilterNot {
  type: 'not';
  filter: FilterExpression;
}

/** Parsed internal representation of a filter query. */
export type FilterExpression = FilterCondition | FilterAnd | FilterOr | FilterNot;

export interface SortField {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PageParams {
  number: number;
  size: number;
}

/** The internal query model passed to storage adapters. */
export interface Query {
  filter?: FilterExpression;
  sort?: SortField[];
  page?: PageParams;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page: PageParams;
}
