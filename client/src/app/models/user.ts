export type User = {
    _id :string,
    username: string,
    email:string,
    role: string
    password: string
}

export interface loginResponse {
    message: string,
    data:User,
    token: string
}
export interface fetchUserResponse {
    message: string,
    data:User,
}