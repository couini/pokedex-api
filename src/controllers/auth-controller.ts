import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import * as moment from 'moment';

import { User } from "../models/User";

const sender = 'smtps://amliebarre@gmail.com';
const password = process.env.MAIL_PASSWORD;

export class AuthController {

    public register = async(req: Request, res: Response) => {
        try {
            let name = req.body.name;
            let email = req.body.email;
            let password = req.body.password;

            const reg = /\S+@\S+\.\S+/;

            this.checkEmailFormat(reg, email);

            let user = await User.findOne({ email: email });

            if (!user) {
                const hashedPassword = bcrypt.hashSync(password, 12);

                const user = new User({
                    name : name,
                    email : email,
                    password : hashedPassword,
                    permissions: req.body.permissions
                });

                await user.save();

                res.status(200).json({
                    success: true,
                    message: 'User created successfully'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Cette adresse mail existe déjà.'
                });
            }

        } catch (err) {
            res.status(401).json({ "message": err.message, "success": false });
        }
    };

    public login = async(req: Request, res: Response) => {
        try {
            let email = req.body.email;
            let password = req.body.password;

            const reg = /\S+@\S+\.\S+/;

            this.checkEmailFormat(reg, email);

            let user = await User.findOne({ email: email });

            if (!user) {
                res.status(500).json({
                    success: false,
                    message: "The user doesn\'t seem to exist"
                });
            }

            let userPassword = await bcrypt.compare(password, user.password);
            let firstTime: boolean;

            if (!userPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Wrong credentials'
                });
            } else {
                let expires = moment().add(1,'days').valueOf();

                if (user.isFirstTime) {
                    firstTime = true;
                } else {
                    firstTime = false;
                }

                const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
                    expiresIn: expires // 1 week
                });

                user['isFirstTime'] = firstTime;

                res.status(200).json({
                    token: token,
                    expiresAt: expires,
                    user: user
                });
            }

        } catch (err) {
            res.status(401).json({ "message": err.message, "success": false });
        }
    };

    public sendEmail = async(req, res) => {

    };

    private checkEmailFormat(reg, email) {
        if (!reg.test(email)) {
            throw new Error("Email is not valid");
        }
    }
}