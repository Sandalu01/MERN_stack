
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const User = require('./models/usermode.js');
const Signup=require('./models/Signupmodel.js')
const Pdfmodel = require('./models/Pdfmodel.js');


const multer  = require('multer')
const app = express();
const bodyParser = require("body-parser");
const fs = require("fs");


app.use(cors());
app.use(express.json()); 
app.use("/files",express.static("files"));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect 
app.use('/photouploads', express.static(path.join(__dirname, 'photouploads'))); 


app.get('/', async (req, res) => {
  res.send(" hello from node api sandalu thushan ");
})

app.post('/adduser', async (req, res) => {
  try {
    
    const { name, email,password,address,age } = req.body;
    const newuser = new User({ name, email, password,age, address });
    const saveduser = await newuser.save();

    res.status(200).json(saveduser);
   
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/signup', async (req, res) => {
  try {
  
    const { name, email,password,confirmPassword } = req.body;

    const newuser = new Signup({ name, email, password,confirmPassword});
    const saveduser = await newuser.save();

    res.status(200).json(saveduser);
   
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//login

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Signup.findOne({ email });
    if (!user) {
      return res.json({ err: "User Not Found" });
    }
    if (user.password === password) {
      return res.json({ status: "ok" });
    } else {
      return res.json({ status: "Incorrect Password" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Server Error" });
  }
});

// upload Images

// Storage configuration for Multer
const storag = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'photouploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploads = multer({
  storage: storag,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, or PNG files are allowed!'));
    }
  },
});

// Mock database (in-memory storage)
let photos = [];

// Routes


// 1. Fetch all photos
app.get('/photos', (req, res) => {
  res.json({ data: photos });
});

// 2. Upload photo
app.post('/uploadphoto', uploads.single('file'), (req, res) => {
  const { title } = req.body;

  if (!req.file) {
    return res.status(400).json({ status: 400, message: 'File not uploaded' });
  }

  const newPhoto = {
    id: Date.now(),
    title: title,
    url: `http://localhost:${PORT}/uploads/${req.file.filename}`,
  };

  photos.push(newPhoto);

  res.status(200).json({ status: 200, message: 'Photo uploaded successfully', data: newPhoto });
});

// Error handling middleware for file upload
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(500).json({ status: 500, message: err.message });
  } else if (err) {
    return res.status(400).json({ status: 400, message: err.message });
  }
  next();
});





//Send PdfImage


// Directory to store uploaded files
const UPLOADS_DIR = "./uploads";
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Route to handle file upload
app.post("/uploadfile", uploads.single("file"), async (req, res) => {
  try {
    const { title } = req.body;
    if (!req.file) {
      return res.status(400).json({ status: 400, message: "No file uploaded" });
    }

    const pdfData = new Pdfmodel({
      title,
      fileName: req.file.filename,
      filePath: `/uploads/${req.file.filename}`,
    });

    const savedPdf = await pdfData.save();

    // Save metadata (optional)

    const metadata = {
      title,
      filePath: req.file.path,
      fileName: req.file.filename,
    };

    // You can save this metadata to a database instead
    const metadataPath = path.join(UPLOADS_DIR, "metadata.json");
    const existingData = fs.existsSync(metadataPath)
      ? JSON.parse(fs.readFileSync(metadataPath, "utf8"))
      : [];
    existingData.push(metadata);
    fs.writeFileSync(metadataPath, JSON.stringify(existingData, null, 2));

    res.status(200).json({ status: 200, message: "File uploaded successfully", metadata });
  } catch (error) {
    console.error("Error uploading file:", error.message);
    res.status(500).json({ status: 500, message: "Error uploading file" });
  }
});

// Route to fetch all uploaded files
app.get("/sendfile", (req, res) => {
  try {
    const metadataPath = path.join(UPLOADS_DIR, "metadata.json");
    const files = fs.existsSync(metadataPath)
      ? JSON.parse(fs.readFileSync(metadataPath, "utf8"))
      : [];
    res.status(200).json({ status: 200, data: files });
  } catch (error) {
    console.error("Error fetching files:", error.message);
    res.status(500).json({ status: 500, message: "Error fetching files" });
  }
});


app.get('/users', async (req, res) => {
  try {
      // Retrieve all products from the database
      const users = await User.find({}); // Find all products

      // Respond with the list of products
      res.status(200).json(users);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
})

app.get('/edituser/:id', async (req, res) => {
  const { id } = req.params; // Get the ID from the request parameters
  try {
      const user = await User.findById(id); // Find the product by ID
      if (!user) {
          return res.status(404).json({ message: 'User not found' }); // Return 404 if not found
      }
      res.status(200).json(user); // Return the found product
  } catch (error) {
      res.status(500).json({ message: error.message }); // Handle any errors
  }
});



app.delete('/user/:id', async (req, res) => {
  const { id } = req.params; // Extract the ID from the request parameters
  try {
      const deleteduser = await User.findByIdAndDelete(id); // Find and delete the product by ID
      if (!deleteduser) {
          return res.status(404).json({ message: 'User not found' }); // Return 404 if product is not found
      }
      res.status(200).json({ message: 'User deleted successfully' }); // Return success message
  } catch (error) {
      res.status(500).json({ message: error.message }); // Handle any errors
  }
});

 

app.put('/edituser/:id', async (req, res) => {
  try {
      const { id } = req.params;

      const user = await User.findByIdAndUpdate(id, req.body);

      if (!user) {
          return res.status(404).json({ message: "user not found" });
      }

      const updateduser = await User.findById(id);
      res.status(200).json(updateduser);

  } catch (error) {
      res.status(500).json({ message: error.message }); // Handle any errors
  }
});


mongoose.connect('mongodb+srv://user1:Thush12213@cluster0.9qwykfs.mongodb.net/MERN2?retryWrites=true&w=majority&appName=Cluster0', {
  
}).then(() => {

      console.log("connected to the database sandalu 🚀🚀🚀🚀");

       app.listen(3001,()=>{
        console.log("server is running on port 3001");
    
    });
      
})
.catch((err) => {
    console.error("Database connection error:", err);
});


//create schema add new schema


