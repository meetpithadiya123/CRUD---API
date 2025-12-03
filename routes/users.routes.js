const express = require('express')
const router = express.Router()
const User = require('../models/users.models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()


router.post('/register',async(req,res) => {
    try{
        const { username ,email, password } = req.body
        const exitingUser = await User.findOne({$or :[{username},{email}]})
        if(exitingUser) return res.status(400).json({message : 'username or email already exist.'})

        const hasedPassword = await bcrypt.hash(password, 10)
        const user = new User({username, email, password : hasedPassword})
        const savedUser = await user.save()

        res.json(savedUser)
    }catch(err){
        res.status(500).json({message: err.message})
    }
})

router.post('/login',async(req,res) => {
    try{
            const {username ,password} = req.body
            const user = await User.findOne({username})
            if(!user) return res.status(404).json({message: 'user not found'})

                const isMatch = await bcrypt.compare(password, user.password)
                if(!isMatch) return res.status(404).json({message: 'Invalid'})

        const token = jwt.sign(
        { userId:user._id, username: user.username},
        process.env.JWT_SECRET,
        { expiresIn: '5h' }
        )
            
            res.json({token})

    }catch(err){
        res.status(500).json({message: err.message})
    }
})

router.post('/logout',async(req,res) => {
    res.json({message:'Logged out successfully.'})
})

module.exports = router