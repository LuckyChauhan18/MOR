const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    // Find the first blog and update it
    const result = await mongoose.connection.db.collection('blogs').findOneAndUpdate(
      {},
      { $set: { ragIndexed: true } },
      { returnDocument: 'after' } // Return the updated document
    );

    if (result) {
      console.log("Updated Blog ID:", result._id);
    } else {
      console.log("No blog found to update");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
