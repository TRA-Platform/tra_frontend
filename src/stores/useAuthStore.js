import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import instance from "@/services/api"
import EventBus from "@/services/EventBus"
import { useProjectRoleStore } from './useProjectRoleStore'

export const useAuthStore = defineStore ({
    id: 'AuthStore',
    state: () => ({
        userData: useStorage ('userData', {
            object_id: "",
            user_id: "",
            username: "",
            first_name: "",
            email: "",
            role: 0,
        }),
        authData: useStorage ('authData', {
            'maintenance': false,
            'access': '',
            'refresh': '',
            'nextUrl': 'index',
            'nextParams': {},
        }),
        projectRolesCache: {}
    }),
    actions: {
        is_authenticated () {
            return !!this.authData.access
        },
        is_admin () {
            return this.userData.role === 9
        },
        is_manager() {
            return this.userData.role === 2 || this.is_admin()
        },
        is_moderator() {
            return this.userData.role === 3 || this.is_manager()
        },
        async getUserProjectRole(projectId) {
            if (!this.is_authenticated()) return null

            if (this.projectRolesCache[projectId]) {
                return this.projectRolesCache[projectId]
            }

            try {
                const projectRoleStore = useProjectRoleStore()
                const { data } = await projectRoleStore.fetchProjectRoles(projectId)
                
                if (data) {
                    const userRole = data.find(role => role.username === this.userData.username)
                    if (userRole) {
                        this.projectRolesCache[projectId] = userRole.role
                        return userRole.role
                    }
                }
                
                return null
            } catch (error) {
                return null
            }
        },
        async hasProjectRole(projectId, requiredRoles = []) {
            if (this.is_admin()) return true

            const role = await this.getUserProjectRole(projectId)
            
            if (!role) return false
            if (requiredRoles.length === 0) return true
            
            return requiredRoles.includes(role)
        },
        async hasProjectRoleAtLeast(projectId, minimumRole) {
            if (this.is_admin()) return true

            const roleHierarchy = {
                'OWNER': 50,
                'ADMIN': 40,
                'MANAGER': 30,
                'MEMBER': 20, 
                'VIEWER': 10,
                '': 0
            }
            
            const role = await this.getUserProjectRole(projectId)
            if (!role) return false
            
            return roleHierarchy[role] >= roleHierarchy[minimumRole]
        },
        async hasProjectOwnerAccess(projectId) {
            return this.is_admin() || await this.hasProjectRole(projectId, ['OWNER'])
        },
        async hasProjectAdminAccess(projectId) {
            return this.is_admin() || await this.hasProjectRole(projectId, ['OWNER', 'ADMIN'])
        },
        async hasProjectWriteAccess(projectId) {
            return this.is_admin() || await this.hasProjectRoleAtLeast(projectId, 'MEMBER')
        },
        async hasProjectDeleteAccess(projectId) {
            return this.is_admin() || await this.hasProjectRoleAtLeast(projectId, 'ADMIN')
        },
        clearProjectRoleCache(projectId) {
            if (projectId) {
                delete this.projectRolesCache[projectId]
            } else {
                this.projectRolesCache = {}
            }
        },
        async login (params) {
            try {
                const response = await instance.post ('/auth/login/', params)
                if (response.status === 200) {
                    this.authData = {
                        ...this.authData,
                        access: response.data.access,
                        refresh: response.data.refresh,
                    }
                    return response
                }
                return {
                    status: response.status,
                    data: response.data
                }
            } catch (error) {
                return {
                    status: error.response?.status || 500,
                    data: error.response?.data || { detail: 'An error occurred during login' }
                }
            }
        },
        async me (params) {
            try {
                const response = await instance.get ('/auth/me/', { params })
                if (response.status === 200) {
                    this.userData = {
                        ...response.data,
                    }
                    return { data: this.userData, error: null }
                }
                localStorage.removeItem('userData')
                return { data: null, error: response.data }
            } catch (error) {
                localStorage.removeItem('userData')
                return { 
                    data: null, 
                    error: error.response?.data || { detail: 'Failed to fetch user data' }
                }
            }
        },
        async changePassword (params) {
            try {
                const response = await instance.post (`/auth/change-password/`, params)
                if (response.status === 200) {
                    return {
                        data: response.data,
                        error: null,
                    }
                }
                return {
                    data: null,
                    error: response.data,
                }
            } catch (error) {
                return {
                    data: null,
                    error: error.response?.data || { detail: 'Failed to change password' }
                }
            }
        },
        async register (params) {
            try {
                const response = await instance.post ('/auth/register/', params)
                return response
            } catch (error) {
                return {
                    status: error.response?.status || 500,
                    data: error.response?.data || { detail: 'Registration failed' }
                }
            }
        },
        async refresh (params) {
            try {
                const response = await instance.post ('/auth/login/refresh/', params)
                if (response.status === 200) {
                    this.authData = {
                        ...this.authData,
                        access: response.data.access,
                    }
                }
                return response
            } catch (error) {
                return {
                    status: error.response?.status || 500,
                    data: error.response?.data || { detail: 'Token refresh failed' }
                }
            }
        },
        logout () {
            localStorage.removeItem('userData')
            localStorage.removeItem('authData')
            this.$reset()
        },
        async registerTrader (params) {
            const response = await instance.post (`/auth/register-trader/`, params)
            if (response.status === 201) {
                return {
                    data: response.data,
                    error: null,
                }
            }

            return {
                data: [],
                error: response.data,
            }
        },
        async registerMerchant (params) {
            const response = await instance.post (`/auth/register-merchant/`, params)
            if (response.status === 201) {
                return {
                    data: response.data,
                    error: null,
                }
            }

            return {
                data: [],
                error: response.data,
            }
        },
        async registerSubMerchant (params) {
            const response = await instance.post (`/auth/register-submerchant/`, params)
            if (response.status === 201) {
                return {
                    data: response.data,
                    error: null,
                }
            }

            return {
                data: [],
                error: response.data,
            }
        },
        async registerTeamLead (params) {
            const response = await instance.post (`/auth/register-teamlead/`, params)
            if (response.status === 201) {
                return {
                    data: response.data,
                    error: null,
                }
            }

            return {
                data: [],
                error: response.data,
            }
        },
        async updateUser (params, id) {
            const response = await instance.patch (`/auth/update-user/${id}/`, params)
            if (response.status === 200) {
                return {
                    data: response.data,
                    error: null,
                }
            }

            return {
                data: [],
                error: response.data,
            }
        },
        async registerSupport (params) {
            const response = await instance.post (`/auth/register-support/`, params)
            if (response.status === 201) {
                return {
                    data: response.data,
                    error: null,
                }
            }

            return {
                data: [],
                error: response.data,
            }
        },
    },
})
