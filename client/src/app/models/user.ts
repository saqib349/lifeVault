export type User = {
    _id :string,
    username: string,
    email:string,
    role: string
    password: string
}

// /login returns either a session (token) or, when 2FA is on,
// a tempToken to exchange for a session at /2fa/verify.
export interface loginResponse {
    message: string,
    data?: User,
    token?: string,
    twoFactorRequired?: boolean,
    tempToken?: string,
    email?: string
}
export interface fetchUserResponse {
    message: string,
    data:User,
}

export interface Profile {
    _id: string,
    username: string,
    email: string,
    role: string,
    twoFactorEnabled: boolean,
    createdAt: string
}

export interface ProfileResponse {
    success: boolean,
    data: Profile
}

export interface MessageResponse {
    success: boolean,
    message: string
}

export interface ChangePasswordResponse extends MessageResponse {
    token: string
}
