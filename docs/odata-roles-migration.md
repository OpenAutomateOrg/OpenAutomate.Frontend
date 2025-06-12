# Migrating Roles Components to OData

This guide shows how to migrate existing roles-related frontend components from using the REST API to the new OData endpoint.

## Benefits of Migration

1. **Powerful Querying**: Filter, sort, and paginate server-side
2. **Better Performance**: Request only needed fields with `$select`
3. **Reduced API Calls**: Get related permissions with `$expand`
4. **Standardized Protocol**: OData is an industry standard
5. **Future-Proof**: Consistent with other OData endpoints in the system

## Quick Start Example

```typescript
// New OData approach - much more powerful!
const { roles, totalCount, isLoading } = useRoles(tenantSlug, {
  searchTerm: 'admin',
  pageSize: 10,
  includeSystemRoles: false,
  orderBy: 'Name asc'
});
```

## Migration Checklist

- [ ] Update SWR keys for OData endpoints
- [ ] Create new API functions with OData query support  
- [ ] Update custom hooks to use server-side operations
- [ ] Migrate components to use new hooks
- [ ] Update data tables for server-side pagination/sorting
- [ ] Test with various OData query combinations
- [ ] Remove old REST API dependencies

## Migration Steps

### Step 1: Update SWR Keys

**Before (REST API):**
```typescript
// lib/swr-config.ts
export const swrKeys = {
  // Old REST keys
  authorities: () => ['authorities'] as const,
  authorityById: (id: string) => ['authorities', id] as const,
}
```

**After (OData):**
```typescript
// lib/swr-config.ts
export const swrKeys = {
  // New OData keys
  roles: (tenantSlug: string, query?: string) => 
    query ? ['odata', 'roles', tenantSlug, query] : ['odata', 'roles', tenantSlug] as const,
  roleById: (tenantSlug: string, id: string, expand?: boolean) => 
    ['odata', 'roles', tenantSlug, id, expand] as const,
}
```

### Step 2: Update API Functions

**Before (REST API):**
```typescript
// lib/api/authorities.ts
export const authoritiesApi = {
  getAll: async (): Promise<AuthorityWithPermissionsDto[]> => {
    const response = await fetch('/api/author/authorities', {
      headers: getAuthHeaders()
    });
    return response.json();
  },
  
  getById: async (id: string): Promise<AuthorityWithPermissionsDto> => {
    const response = await fetch(`/api/author/authority/${id}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  }
};
```

**After (OData):**
```typescript
// lib/api/roles.ts
export interface RolesQueryOptions {
  filter?: string;
  select?: string[];
  orderBy?: string;
  top?: number;
  skip?: number;
  count?: boolean;
  expand?: boolean;
}

export const rolesApi = {
  getAll: async (tenantSlug: string, options: RolesQueryOptions = {}): Promise<{
    roles: AuthorityWithPermissionsDto[];
    totalCount?: number;
  }> => {
    const params = new URLSearchParams();
    
    if (options.filter) params.append('$filter', options.filter);
    if (options.select) params.append('$select', options.select.join(','));
    if (options.orderBy) params.append('$orderby', options.orderBy);
    if (options.top) params.append('$top', options.top.toString());
    if (options.skip) params.append('$skip', options.skip.toString());
    if (options.count) params.append('$count', 'true');
    if (options.expand) params.append('$expand', 'Permissions');
    
    const response = await fetch(`/${tenantSlug}/odata/Roles?${params}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch roles: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      roles: data.value,
      totalCount: data['@odata.count']
    };
  },
  
  getById: async (tenantSlug: string, id: string, expand = true): Promise<AuthorityWithPermissionsDto> => {
    const params = new URLSearchParams();
    if (expand) params.append('$expand', 'Permissions');
    
    const response = await fetch(`/${tenantSlug}/odata/Roles(${id})?${params}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch role: ${response.statusText}`);
    }
    
    return response.json();
  }
};
```

### Step 3: Update Custom Hooks

**Before (REST API):**
```typescript
// hooks/useRoles.ts
export function useRoles() {
  const { data: roles, error, isLoading, mutate } = useSWR(
    swrKeys.authorities(),
    authoritiesApi.getAll
  );
  
  return {
    roles: roles || [],
    error,
    isLoading,
    refetch: mutate
  };
}
```

**After (OData):**
```typescript
// hooks/useRoles.ts
interface UseRolesOptions {
  searchTerm?: string;
  pageSize?: number;
  orderBy?: string;
  includeSystemRoles?: boolean;
  expand?: boolean;
}

export function useRoles(tenantSlug: string, options: UseRolesOptions = {}) {
  const {
    searchTerm,
    pageSize = 10,
    orderBy = 'Name asc',
    includeSystemRoles = true,
    expand = false
  } = options;
  
  // Build query options
  const queryOptions: RolesQueryOptions = {
    orderBy,
    count: true,
    expand
  };
  
  // Add filters
  const filters = [];
  if (searchTerm) {
    filters.push(`contains(tolower(Name), tolower('${searchTerm}'))`);
  }
  if (!includeSystemRoles) {
    filters.push('IsSystemAuthority eq false');
  }
  if (filters.length > 0) {
    queryOptions.filter = filters.join(' and ');
  }
  
  if (pageSize) {
    queryOptions.top = pageSize;
  }
  
  // Create SWR key
  const queryString = new URLSearchParams();
  Object.entries(queryOptions).forEach(([key, value]) => {
    if (value !== undefined) {
      queryString.append(`$${key}`, value.toString());
    }
  });
  
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.roles(tenantSlug, queryString.toString()),
    () => rolesApi.getAll(tenantSlug, queryOptions)
  );
  
  return {
    roles: data?.roles || [],
    totalCount: data?.totalCount || 0,
    error,
    isLoading,
    refetch: mutate
  };
}

export function useRole(tenantSlug: string, roleId: string | null, expand = true) {
  const { data: role, error, isLoading, mutate } = useSWR(
    roleId ? swrKeys.roleById(tenantSlug, roleId, expand) : null,
    roleId ? () => rolesApi.getById(tenantSlug, roleId, expand) : null
  );
  
  return {
    role,
    error,
    isLoading,
    refetch: mutate
  };
}
```

### Step 4: Update Components

**Before (roles.tsx):**
```typescript
export function Roles() {
  const [searchTerm, setSearchTerm] = useState('');
  const { roles, isLoading, error } = useRoles();
  
  // Client-side filtering
  const filteredRoles = useMemo(() => {
    return roles.filter(role => 
      role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <SearchInput 
        value={searchTerm} 
        onChange={setSearchTerm}
        placeholder="Search roles..."
      />
      
      <div className="roles-grid">
        {filteredRoles.map(role => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>
    </div>
  );
}
```

**After (roles.tsx with OData):**
```typescript
export function Roles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [includeSystemRoles, setIncludeSystemRoles] = useState(true);
  const pageSize = 12;
  
  // Get tenant from context/params
  const tenantSlug = useTenantSlug();
  
  // Server-side filtering and pagination with OData
  const { roles, totalCount, isLoading, error } = useRoles(tenantSlug, {
    searchTerm,
    pageSize,
    includeSystemRoles,
    expand: false // Don't need permissions for the grid view
  });
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <div className="filters">
        <SearchInput 
          value={searchTerm} 
          onChange={setSearchTerm}
          placeholder="Search roles..."
        />
        
        <Checkbox
          checked={includeSystemRoles}
          onCheckedChange={setIncludeSystemRoles}
        >
          Include System Roles
        </Checkbox>
      </div>
      
      <div className="roles-grid">
        {roles.map(role => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalCount}
      />
    </div>
  );
}
```

### Step 5: Update Role Details Component

**Before (rolesDetail.tsx):**
```typescript
export function RoleDetail({ roleId }: { roleId: string }) {
  const { data: role, isLoading, error } = useSWR(
    swrKeys.authorityById(roleId),
    () => authoritiesApi.getById(roleId)
  );
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!role) return <NotFound />;
  
  return (
    <div>
      <h1>{role.name}</h1>
      <p>{role.description}</p>
      
      <div className="permissions">
        <h2>Permissions</h2>
        {role.permissions?.map(permission => (
          <PermissionItem key={permission.resourceName} permission={permission} />
        ))}
      </div>
    </div>
  );
}
```

**After (rolesDetail.tsx with OData):**
```typescript
export function RoleDetail({ roleId }: { roleId: string }) {
  const tenantSlug = useTenantSlug();
  const { role, isLoading, error } = useRole(tenantSlug, roleId, true); // expand permissions
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!role) return <NotFound />;
  
  return (
    <div>
      <h1>{role.name}</h1>
      <p>{role.description}</p>
      
      {role.isSystemAuthority && (
        <Badge variant="secondary">System Role</Badge>
      )}
      
      <div className="permissions">
        <h2>Permissions ({role.permissions.length})</h2>
        {role.permissions.map(permission => (
          <PermissionItem key={permission.resourceName} permission={permission} />
        ))}
      </div>
    </div>
  );
}
```

### Step 6: Update Data Table Implementation

**Before:**
```typescript
// Basic data table with client-side operations
export function RolesDataTable() {
  const { roles, isLoading } = useRoles();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const filteredAndSortedData = useMemo(() => {
    let result = [...roles];
    
    // Client-side filtering
    if (globalFilter) {
      result = result.filter(role =>
        role.name.toLowerCase().includes(globalFilter.toLowerCase())
      );
    }
    
    // Client-side sorting
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      result.sort((a, b) => {
        const aVal = a[id as keyof typeof a];
        const bVal = b[id as keyof typeof b];
        return desc ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
      });
    }
    
    return result;
  }, [roles, globalFilter, sorting]);
  
  // ... rest of component
}
```

**After:**
```typescript
// Server-side operations with OData
export function RolesDataTable() {
  const tenantSlug = useTenantSlug();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // Build OData query options
  const queryOptions = useMemo(() => {
    const options: RolesQueryOptions = {
      top: pagination.pageSize,
      skip: pagination.pageIndex * pagination.pageSize,
      count: true,
      select: ['Id', 'Name', 'Description', 'IsSystemAuthority', 'CreatedAt'], // Only needed columns
    };
    
    // Server-side sorting
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      options.orderBy = `${id} ${desc ? 'desc' : 'asc'}`;
    }
    
    // Server-side filtering
    const filters = [];
    if (globalFilter) {
      filters.push(`contains(tolower(Name), tolower('${globalFilter}'))`);
    }
    
    // Column-specific filters
    columnFilters.forEach(filter => {
      if (filter.id === 'isSystemAuthority') {
        filters.push(`IsSystemAuthority eq ${filter.value}`);
      }
    });
    
    if (filters.length > 0) {
      options.filter = filters.join(' and ');
    }
    
    return options;
  }, [pagination, sorting, globalFilter, columnFilters]);
  
  const { roles, totalCount, isLoading, error } = useRoles(tenantSlug, queryOptions);
  
  // Calculate page count for server-side pagination
  const pageCount = Math.ceil(totalCount / pagination.pageSize);
  
  const table = useReactTable({
    data: roles,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
      globalFilter,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    manualPagination: true, // Server-side pagination
    manualSorting: true,    // Server-side sorting
    manualFiltering: true,  // Server-side filtering
    getCoreRowModel: getCoreRowModel(),
  });
  
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <DataTableToolbar table={table} />
      <DataTable table={table} isLoading={isLoading} />
      <DataTablePagination table={table} />
    </div>
  );
}
```

## Performance Benefits

### Before (REST API):
- 🔴 All roles loaded at once
- 🔴 Client-side filtering and sorting
- 🔴 All fields always fetched
- 🔴 Separate API call for role details

### After (OData):
- ✅ Paginated loading (10-50 items per request)
- ✅ Server-side filtering and sorting
- ✅ Selective field loading with `$select`
- ✅ Permissions loaded on demand with `$expand`

## Common Query Examples

### Dashboard Role Summary
```typescript
const { roles } = useRoles(tenantSlug, {
  select: ['Id', 'Name'],
  filter: 'IsSystemAuthority eq false',
  orderBy: 'Name asc',
  top: 5
});
```

### Role Management Grid
```typescript
const { roles, totalCount } = useRoles(tenantSlug, {
  select: ['Id', 'Name', 'Description', 'IsSystemAuthority', 'CreatedAt'],
  orderBy: 'CreatedAt desc',
  top: 20,
  count: true
});
```

### Search with Pagination
```typescript
const { roles, totalCount } = useRoles(tenantSlug, {
  searchTerm: 'admin',
  pageSize: 10,
  includeSystemRoles: false
});
```

## Migration Checklist

- [ ] Update SWR keys for OData endpoints
- [ ] Create new API functions with OData query support
- [ ] Update custom hooks to use server-side operations
- [ ] Migrate components to use new hooks
- [ ] Update data tables for server-side pagination/sorting
- [ ] Test with various OData query combinations
- [ ] Update any role selection dropdowns
- [ ] Remove old REST API dependencies
- [ ] Update error handling for OData responses
- [ ] Performance test with large datasets

## Troubleshooting

### Common Issues:

1. **"Invalid OData syntax"**: Check query parameter formatting
2. **"No data returned"**: Verify tenant context and permissions
3. **"Performance issues"**: Use `$select` to limit fields, implement pagination
4. **"Authentication errors"**: Ensure JWT token is properly included

### Debug Tips:

```typescript
// Log the actual OData URL being called
console.log('OData URL:', `/${tenantSlug}/odata/Roles?${queryParams}`);

// Test queries directly in browser/Postman
// GET /{tenant}/odata/Roles?$top=5&$select=Id,Name
```

## Next Steps

1. Start with low-traffic components (role dropdowns)
2. Migrate main roles listing page
3. Update role detail views
4. Migrate data tables with server-side operations
5. Remove old REST API endpoints
6. Monitor performance improvements 