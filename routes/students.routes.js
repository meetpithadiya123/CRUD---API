const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Student = require('../models/students.models');

//  Ensure uploads folder exists 
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

//  Multer storage config 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const newFileName = Date.now() + path.extname(file.originalname);
    cb(null, newFileName);
  }
});

//  Multer file filter 
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

//  Multer setup 
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 3 // 3MB max
  }
});

//  CREATE STUDENT
router.post('/', upload.single('profile_pic'), async (req, res) => {
  try {
    const studentData = new Student({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      gender: req.body.gender,
      profile_pic: req.file ? req.file.filename : null
    });

    const newStudent = await Student.create(studentData);
    res.status(201).json(newStudent);
  } catch (err) {
    console.error('Create Error:', err);
    res.status(400).json({ message: err.message });
  }
});

//  GET ALL STUDENTS (with optional search & pagination)
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { first_name: { $regex: search, $options: 'i' } },
            { last_name: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const students = await Student.find(query).skip(skip).limit(limit);
    const totalStudents = await Student.countDocuments(query);
    const totalPages = Math.ceil(totalStudents / limit);

    res.json({ students, totalPages });
  } catch (err) {
    console.error('Get All Error:', err);
    res.status(500).json({ message: err.message });
  }
});

//  GET SINGLE STUDENT BY ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student)
      return res.status(404).json({ message: 'Student not found' });

    res.json(student);
  } catch (err) {
    console.error('Get Single Error:', err);
    res.status(500).json({ message: err.message });
  }
});

//  UPDATE STUDENT (supports new profile picture upload)
router.put('/:id', upload.single('profile_pic'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student)
      return res.status(404).json({ message: 'Student not found' });

    const { first_name, last_name, email, phone, gender } = req.body;
    const updateData = { first_name, last_name, email, phone, gender };

    // If new profile picture is uploaded
    if (req.file) {
      // delete old file if exists
      if (student.profile_pic) {
        const oldPath = path.join(uploadDir, student.profile_pic);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateData.profile_pic = req.file.filename;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedStudent);
  } catch (err) {
    console.error('Update Error:', err);
    res.status(400).json({ message: err.message });
  }
});

//  DELETE STUDENT
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student)
      return res.status(404).json({ message: 'Student not found' });

    // delete profile picture if exists
    if (student.profile_pic) {
      const filePath = path.join(uploadDir, student.profile_pic);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
