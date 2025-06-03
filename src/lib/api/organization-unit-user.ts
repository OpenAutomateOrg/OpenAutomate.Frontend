import { api } from './client'

export interface ODataQueryOptions {
    $filter?: string
    $orderby?: string
    $top?: number
    $skip?: number
    $select?: string
    $count?: boolean
    $expand?: string
}

export interface ODataResponse<T> {
    value: T[]
    '@odata.count'?: number
}

export interface OrganizationUnitUser {
    userId: string
    email: string
    firstName: string
    lastName: string
    role: string
    joinedAt: string
}

function getCurrentTenant(): string {
    if (typeof window !== 'undefined') {
        const path = window.location.pathname.split('/')
        if (path.length > 1 && path[1]) {
            return path[1]
        }
    }
    return 'default'
}

function buildODataQueryString(options?: ODataQueryOptions): string {
    if (!options) return ''
    const params = new URLSearchParams()
    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            params.append(key, String(value))
        }
    })
    return params.toString()
}

function processODataResponse(response: unknown): ODataResponse<OrganizationUnitUser> {
    if (typeof response === 'object' && response !== null && 'value' in response) {
        return response as ODataResponse<OrganizationUnitUser>
    }
    if (Array.isArray(response)) {
        return { value: response as OrganizationUnitUser[], '@odata.count': response.length }
    }
    return { value: [] }
}

export const getOrganizationUnitUsersWithOData = async (
    options?: ODataQueryOptions,
): Promise<ODataResponse<OrganizationUnitUser>> => {
    const tenant = getCurrentTenant()
    const queryString = buildODataQueryString(options)
    let endpoint = `${tenant}/odata/OrganizationUnitUsers`
    if (queryString) {
        endpoint += `?${queryString}`
    }
    const response = await api.get<unknown>(endpoint)
    return processODataResponse(response)
}

export interface OrganizationUnitUserResponse {
    count: number
    users: OrganizationUnitUser[]
}

export const organizationUnitUserApi = {
    getUsers: async (tenant: string): Promise<OrganizationUnitUser[]> => {
        const res = await api.get<OrganizationUnitUserResponse>(`/api/ou/${tenant}/users`)
        return res.users
    },
} 