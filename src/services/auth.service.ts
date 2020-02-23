import { Service } from "typedi";
import { Response } from "express";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { EmailTakenError } from "./../errors/HttpError";

import { IUser, IUserInputDTO } from './../interfaces/IUser';
import User from '../models/User';

class HttpError {
    public code: number;
    public message: string;

    constructor(message, code) {
        this.code = code;
        this.message = message
      }
}

@Service()
export default class AuthService {

    constructor() {}

    /**
     * SignUp service to authenticate the user
     * @param {IUserInputDTO} userInputDTO 
     * @returns {Promise<{ user: IUser; token: string }>}
     */
    public async SignUp(userInputDTO: IUserInputDTO, res: Response): Promise<{ user: IUser; token: string }> {
        try {
             // Check if email has the right pattern
            this.checkEmailFormat(userInputDTO.email);

            // If user already exists in DB, send error
            const existingUser = await User.findOne({ email: userInputDTO.email });

            if (existingUser) {
                throw new EmailTakenError('Email already registered');
            }

            const hashedPassword = await bcrypt.hash(userInputDTO.password, 12);
            
            const userRecord = await User.create({
                ...userInputDTO,
                role: 'USER',
                password: hashedPassword,
            });
            const token = this.generateToken(userRecord);

            if (!userRecord) {
                throw new Error('User cannot be created');
            }

            const user = userRecord.toObject();

            return { user, token };

        } catch (e) {
            throw e;
        }
    }

    /**
     * SignIn service to login the user
     * @param email 
     * @param password 
     */
    public async SignIn(email: string, password: string): Promise<{ user: IUser; token: string }> {
        try {
            const userRecord = await User.findOne({ email });

            if (!userRecord) {
                throw new Error('User not registered');
            }
    
            let validPassword = await bcrypt.compare(password, userRecord.password);
    
            if (validPassword) {
                const token = this.generateToken(userRecord);
                const user = userRecord.toObject();
                Reflect.deleteProperty(user, 'password');
                return { user, token };
            } else {
                throw new Error('Invalid Password');
            }
        } catch(e) {
            throw e;
        }
    }

    /**
     * Generate a unique token for the user
     * @param {IUSer} user
     * @returns {void}
     */
    private generateToken(user: IUser) {
        const today = new Date();
        const expired = new Date(today);
        expired.setDate(today.getDate() + 60);

        return jwt.sign(
            {
              _id: user._id,
              role: user.role,
              expired: expired.getTime() / 1000,
            },
            process.env.JWT_SECRET
        );
    }

    /**
     * Check if the email has the right format
     * @param {string} email
     * @returns {void}
     */
    private checkEmailFormat(email: string) {
        const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegexp.test(email)) {
            throw new Error("EMAIL_NOT_VALID");
        }
    }
}