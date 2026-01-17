// Location DTOs
export class CreateLocationDto {
  name: string;
  code: string;
  description?: string;
  address?: string;
  building?: string;
  floor?: string;
  room?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  bin?: string;
  parentLocationId?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export class UpdateLocationDto {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  building?: string;
  floor?: string;
  room?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  bin?: string;
  parentLocationId?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// Manufacturer DTOs
export class CreateManufacturerDto {
  name: string;
  code: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export class UpdateManufacturerDto {
  name?: string;
  code?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// Supplier DTOs
export class CreateSupplierDto {
  name: string;
  code: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  fax?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  rating?: number;
  isActive?: boolean;
  isPreferred?: boolean;
  metadata?: Record<string, any>;
}

export class UpdateSupplierDto {
  name?: string;
  code?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  fax?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  rating?: number;
  isActive?: boolean;
  isPreferred?: boolean;
  metadata?: Record<string, any>;
}

// Category DTOs
export class CreateCategoryDto {
  name: string;
  code: string;
  description?: string;
  parentCategoryId?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export class UpdateCategoryDto {
  name?: string;
  code?: string;
  description?: string;
  parentCategoryId?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}
