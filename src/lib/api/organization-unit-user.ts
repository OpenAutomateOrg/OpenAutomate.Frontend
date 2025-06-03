import { api } from './client'

export interface OrganizationUnitUser {
    userId: string
    email: string
    firstName: string
    lastName: string
    role: string
    joinedAt: string
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