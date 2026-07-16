import type {
  EntityId,
  ISODateTime,
  JsonPrimitive,
} from "./common";

export interface Business {
  id: EntityId;
  name: string;
  industry?: string;
  description?: string;
  ownerId: EntityId;
  createdAt: ISODateTime;
}

export type ProductAttributeValue =
  | JsonPrimitive
  | JsonPrimitive[];

export interface Product {
  id: EntityId;
  businessId: EntityId;
  name: string;
  sku?: string;
  price?: number;
  currency: string;
  attributes: Record<string, ProductAttributeValue>;
  sourceKbId?: EntityId;
}
