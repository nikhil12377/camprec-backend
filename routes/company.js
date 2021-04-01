const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { check,validationResult } = require('express-validator');
const CompanySchema = require('../schemas/Company');
const config = require('config');

router.get(
    '/',
    async (req,res) => {
    return res.status(200).json({msg : "hello"});
    });

router.post(
    '/signup',
    [
        check('email','E-mail is required').isEmail(),
        check('password','Password is required').not().isEmpty(),
        check('name','name is required').not().isEmpty(),
        check('premium','premium is required').not().isEmpty(),
        check('location','location is required').not().isEmpty(),
        check('year_of_established','year_of_established is required').not().isEmpty(),
    ],
    async (req,res) => {
        try{
            let {email,password,name,about,year_of_established,location,website,vedio_link,premium = false} = req.body;
            let company = await CompanySchema.findOne({email : email});
            const errors = validationResult(req);
            if(!errors.isEmpty())
            {
                return res.status(401).json({errors : errors.array()});
            }

            if(company){
                return res.status(401).json({ msg : "present"})
            }
            
            const salt = await bcryptjs.genSalt(10);
            password = await bcryptjs.hash(password,salt);

            company = new CompanySchema({
                email,
                password,
                name,
                about,
                year_of_established,
                location,
                website,
                vedio_link,
                premium
             });
             await company.save();

             const payload = {
                company : {
                    id : company.id
                }
             }
             jwt.sign(
                payload,
                config.get('jwtSecret'),
                (err,token) =>
                {
                    if(err)
                    {
                        throw err;
                    }      
                    res.json({token});
                }
             )
             res.send('true');
        } catch (error){
            console.log(error.message);
            return res.status(500).json({ msg : "Server Error....."});
        }
    }
);

router.post(
    '/login',
    [
        check('email','type your email').isEmail(),
        check('password','Password is required').not().isEmpty()
    ],
    async (req,res) => {
        try {
            let {email,password} = req.body;
            console.log(req.body);
            const errors = validationResult(req);
            let company = await CompanySchema.findOne({email})

            if(!errors.isEmpty()){
                return res.status(401).json({errors : errors.array})
            
            }
            if(!company){
                return res.status(401).json("Not Found");
            }

            let isPasswordMatch = await bcryptjs.compare(password,company.password);

            if(isPasswordMatch === true){
                const payload = {
                    company : {
                        id : company.id
                    }
                 }
                 jwt.sign(
                    payload,
                    config.get('jwtSecret'),
                    (err,token) =>
                    {
                        if(err)
                        {
                            throw err;
                        } 
                        console.log(company);     
                        res.status(200).json(company);
                    }
                 )
                
            }
            else {
                res.status(401).json('password dont match');
            }

       } catch (error){
            console.log(error.message);
            return res.status(500).json({msg : "Server Error..."});
       }
    }
);

router.get(
    '/list',
    async (req,res) => {
        console.log("list");
        const data = await CompanySchema.find({});
        res.send(data);
    }
);


router.post(
    '/edit',
    async(req,res) => {
        console.log(req.body);
        let {company_id,name,about,location,website,social_media : {twitter,facebook,linkedin,instagram},vedio_link} = req.body;
        var data = await CompanySchema.findByIdAndUpdate(company_id,{ "name" : name,"about" : about,"location": location,"website" : website, social_media : {"twitter" : twitter,"facebook" : facebook,"linkedin" : linkedin,"instagram" : instagram},"vedio_link" : vedio_link });
        console.log(data);
        var data2 = await CompanySchema.findById(company_id)
        res.send(data2);
    }
)
module.exports = router;
