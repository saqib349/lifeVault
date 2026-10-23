    import User from "../models/User.js";
    import { hashingPassword, verifyPassword } from "../utils/hashing.js";
    import { generateToken } from "../utils/tokens.js";

    export async function signup(req, res, next) {
        try {
            const { username, email, password} = req.body;
            const hashedPassword =await hashingPassword(password)
            console.log(hashedPassword)
            await User.create({
                username,
                email,
                password: hashedPassword
            });

            return res.status(201).json({
                message: "User registered successfully"
            });
        } catch (error) {
            if (error.code === 11000 && error.keyPattern?.email) {
                error.statusCode = 409;
                error.message = "Email already exists";
            }

            return next(error);
        }
    }

    export async function  login(req,res,next){
        try {
            console.log(req.body)
            const { email, password } = req.body;
            const user =await User.findOne({email}).select("+password")
            console.log(user)
            if (!user){
                return res.status(401).json({
                    message: "Invalid email or password"
                })
            }
            const isValid= await verifyPassword(password,user.password)
            if (!isValid){
                return res.status(401).json({
                    message: "Invalid email or password"
                })
            }
            const token = generateToken({_id:user._id,role:user.role,username:user.username})
            return res.status(200).json({
                    message: "sucessfully login",
                    data: {
                        _id:user._id,
                        username:user.username,
                        role:user.role
                    },
                    token
                })
        }
        catch(err){
            next(err)
        }
    }