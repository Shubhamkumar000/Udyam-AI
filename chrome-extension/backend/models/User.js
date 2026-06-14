const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ProfileSchema = new mongoose.Schema({
  name:       { type: String, default: '' },
  email:      { type: String, default: '' },
  phone:      { type: String, default: '' },
  dob:        { type: String, default: '' },
  gender:     { type: String, default: '' },
  address:    { type: String, default: '' },
  city:       { type: String, default: '' },
  state:      { type: String, default: '' },
  pincode:    { type: String, default: '' },
  country:    { type: String, default: '' },
  linkedin:   { type: String, default: '' },
  github:     { type: String, default: '' },
  occupation: { type: String, default: '' },
  company:    { type: String, default: '' },
  pan:        { type: String, default: '' },
  aadhaar:    { type: String, default: '' },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  profile: { type: ProfileSchema, default: () => ({}) },
  isVerified: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Auto-sync name to profile
UserSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.profile.name) {
    this.profile.name = this.name;
  }
  if (this.isModified('email') && !this.profile.email) {
    this.profile.email = this.email;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
