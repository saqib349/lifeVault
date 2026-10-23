import bcrypt from "bcrypt"

export function  hashingPassword(password){
    return bcrypt.hash(password,10)
}
export function  verifyPassword(password,hashPassword){
    return bcrypt.compare(password,hashPassword)
}

