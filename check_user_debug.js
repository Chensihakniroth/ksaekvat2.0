const mongoose = require('mongoose');
// Look for the specific path in the dist folder
const User = require('./dist/models/User').default || require('./dist/models/User');
const { getMongoURI } = require('./dist/utils/env');

async function check() {
  const uri = getMongoURI();
  console.log('Connecting to:', uri);
  await mongoose.connect(uri);
  const user = await User.findOne({ id: '703266672022388789' }).lean();
  if (!user) {
    console.log('User not found!');
  } else {
    console.log('User Animals:', JSON.stringify(user.animals, null, 2));
  }
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
