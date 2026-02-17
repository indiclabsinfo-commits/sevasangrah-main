import {
  patientService,
  doctorService,
  transactionService,
  bedService,
  dashboardService,
  departmentService,
  appointmentService,
  auditService,
  customService,
  expenseService,
  medicineService,
  emailService,
  hospitalService,
  userService
} from '../services/azureApiService';

// Query builder to mimic Supabase API
class QueryBuilder {
  tableName: string;
  selectFields: string | string[];
  filters: any[];
  orderField: string | null;
  orderAsc: boolean;
  limitValue: number | null;
  singleResult: boolean;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.selectFields = '*';
    this.filters = [];
    this.orderField = null;
    this.orderAsc = true;
    this.limitValue = null;
    this.singleResult = false;
  }

  select(fields: string | string[] = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push({ field, op: 'neq', value });
    return this;
  }

  gt(field: string, value: any) {
    this.filters.push({ field, op: 'gt', value });
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push({ field, op: 'gte', value });
    return this;
  }

  lt(field: string, value: any) {
    this.filters.push({ field, op: 'lt', value });
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push({ field, op: 'lte', value });
    return this;
  }

  like(field: string, pattern: string) {
    this.filters.push({ field, op: 'like', value: pattern });
    return this;
  }

  ilike(field: string, pattern: string) {
    this.filters.push({ field, op: 'ilike', value: pattern });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, op: 'in', value: values });
    return this;
  }

  order(field: string, options: { ascending?: boolean } = {}) {
    this.orderField = field;
    this.orderAsc = options.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  single() {
    this.singleResult = true;
    this.limitValue = 1;
    return this;
  }

  async insert(data: any) {
    try {
      let result;

      switch (this.tableName) {
        case 'patients': result = await patientService.create(data); break;
        case 'doctors': result = await doctorService.create(data); break;
        case 'patient_transactions': result = await transactionService.create(data); break;
        case 'appointments': result = await appointmentService.create(data); break;
        case 'audit_logs': result = await auditService.create(data); break;
        case 'custom_services': result = await customService.create(data); break;
        case 'daily_expenses': result = await expenseService.create(data); break;
        case 'medicines': result = await medicineService.create(data); break;
        case 'email_logs': result = await emailService.create(data); break;
        case 'hospitals': result = await hospitalService.create(data); break;
        default:
          return { data: null, error: { message: `Table ${this.tableName} insert not implemented` } };
      }

      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Insert failed' } };
    }
  }

  async update(data: any) {
    try {
      // Extract ID from filters
      const idFilter = this.filters.find(f => f.field === 'id' && f.op === 'eq');
      if (!idFilter) {
        return { data: null, error: { message: 'ID filter required for update' } };
      }

      let result;

      switch (this.tableName) {
        case 'patients': result = await patientService.update(idFilter.value, data); break;
        case 'doctors': result = await doctorService.update(idFilter.value, data); break;
        case 'beds': result = await bedService.update(idFilter.value, data); break;
        case 'appointments': result = await appointmentService.update(idFilter.value, data); break;
        case 'audit_logs': result = await auditService.update(idFilter.value, data); break;
        case 'custom_services': result = await customService.update(idFilter.value, data); break;
        case 'daily_expenses': result = await expenseService.update(idFilter.value, data); break;
        case 'medicines': result = await medicineService.update(idFilter.value, data); break;
        case 'email_logs': result = await emailService.update(idFilter.value, data); break;
        case 'hospitals': result = await hospitalService.update(idFilter.value, data); break;
        default:
          return { data: null, error: { message: `Table ${this.tableName} update not implemented` } };
      }

      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Update failed' } };
    }
  }

  async delete() {
    try {
      const idFilter = this.filters.find(f => f.field === 'id' && f.op === 'eq');
      if (!idFilter) {
        return { data: null, error: { message: 'ID filter required for delete' } };
      }

      let result;

      switch (this.tableName) {
        case 'patients': result = await patientService.delete(idFilter.value); break;
        case 'doctors': result = await doctorService.delete(idFilter.value); break;
        case 'appointments': result = await appointmentService.delete(idFilter.value); break;
        case 'audit_logs': result = await auditService.delete(idFilter.value); break;
        case 'custom_services': result = await customService.delete(idFilter.value); break;
        case 'daily_expenses': result = await expenseService.delete(idFilter.value); break;
        case 'medicines': result = await medicineService.delete(idFilter.value); break;
        case 'email_logs': result = await emailService.delete(idFilter.value); break;
        case 'hospitals': result = await hospitalService.delete(idFilter.value); break;
        default:
          return { data: null, error: { message: `Table ${this.tableName} delete not implemented` } };
      }

      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Delete failed' } };
    }
  }

  // Execute the query
  async then(resolve: any, reject: any) {
    try {
      let data: any[] = [];

      switch (this.tableName) {
        case 'patients': data = await patientService.getAll(); break;
        case 'doctors': data = await doctorService.getAll(); break;
        case 'beds': data = await bedService.getAll(); break;
        case 'patient_transactions': data = await transactionService.getAll(); break;
        case 'departments': data = await departmentService.getAll(); break;
        case 'appointments': data = await appointmentService.getAll(); break;
        case 'audit_logs': data = await auditService.getAll(); break;
        case 'custom_services': data = await customService.getAll(); break;
        case 'daily_expenses': data = await expenseService.getAll(); break;
        case 'medicines': data = await medicineService.getAll(); break;
        case 'email_logs': data = await emailService.getAll(); break;
        case 'hospitals': data = await hospitalService.getAll(); break;
        case 'users': data = await userService.getAll(); break;
        default:
          console.warn(`Table ${this.tableName} not implemented in Azure API, returning empty`);
          data = [];
      }

      // Apply client-side filters if any
      if (this.filters.length > 0) {
        data = this.applyFilters(data);
      }

      // Apply ordering
      if (this.orderField) {
        data = this.applyOrdering(data);
      }

      // Apply limit
      if (this.limitValue) {
        data = data.slice(0, this.limitValue);
      }

      // Return single or array
      const result = {
        data: this.singleResult ? (data[0] || null) : data,
        error: null,
        count: data.length // Mock count
      };

      resolve(result);
    } catch (error: any) {
      const result = {
        data: null,
        error: { message: error.message || 'Query failed' }
      };

      if (reject) {
        reject(result);
      } else {
        resolve(result);
      }
    }
  }

  applyFilters(data: any[]) {
    return data.filter(item => {
      return this.filters.every(filter => {
        const value = item[filter.field];

        switch (filter.op) {
          case 'eq': return value === filter.value;
          case 'neq': return value !== filter.value;
          case 'gt': return value > filter.value;
          case 'gte': return value >= filter.value;
          case 'lt': return value < filter.value;
          case 'lte': return value <= filter.value;
          case 'like': return String(value).includes(filter.value.replace(/%/g, ''));
          case 'ilike': return String(value).toLowerCase().includes(filter.value.replace(/%/g, '').toLowerCase());
          case 'in': return Array.isArray(filter.value) && filter.value.includes(value);
          default: return true;
        }
      });
    });
  }

  applyOrdering(data: any[]) {
    return [...data].sort((a, b) => {
      const aVal = a[this.orderField!];
      const bVal = b[this.orderField!];

      if (aVal < bVal) return this.orderAsc ? -1 : 1;
      if (aVal > bVal) return this.orderAsc ? 1 : -1;
      return 0;
    });
  }
}

class SupabaseCompatibility {
  from(tableName: string) {
    return new QueryBuilder(tableName);
  }
}

// Create and export the Supabase-compatible client
export const supabase = new SupabaseCompatibility();

// Also export as default
export default supabase;

// Export types for compatibility
export type * from '../types/supabase';