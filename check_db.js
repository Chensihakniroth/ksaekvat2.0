const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ksaekvat_bot';
  console.log('Connecting to:', uri);
  await mongoose.connect(uri);
  
  const User = mongoose.model('User', new mongoose.Schema({
    id: String,
    username: String,
    profileTheme: mongoose.Schema.Types.Mixed
  }));
  
  const user = await User.findOne({ id: '703266672022388789' }).lean();
  console.log('User 703266672022388789:', JSON.stringify(user, null, 2));
  
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
