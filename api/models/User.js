const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true, 
    lowercase: true, 
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
  	default: 'pendiente' 
  },
  rol: {
  	type: String,
  	enum: ['usuario', 'admin'],
  	default: 'usuario' 
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  	next();
  } catch (error) {
  	next(error);
  }
});

module.exports = mongoose.model('User', userSchema);