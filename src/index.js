require("dotenv").config()
const express = require("express")
const multer = require("multer")
const multerS3 = require("multer-s3")
const aws = require("aws-sdk");
const app = express()

const s3 = new aws.S3({
    region: process.env.STORAGE_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
})

const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.S3_BUCKET,
      metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
        cb(null, `${file.fieldname}${Date.now().toString()}`)
      }
    })
  })

app.post("/files", upload.single("file"), (request, response) => {
    response.status(201).json({
        linkAccessFile: `http://localhost:3000/link-files/${request.file.key}`,
        key: request.file.key
    })
})

app.get("/link-files/:fileId", (request, response) => {
    const presignedUrl = s3.getSignedUrl('getObject', {
        Bucket: process.env.S3_BUCKET,
        Key: request.params.fileId, 
        Expires: 100 
    });

    return response.redirect(presignedUrl)
})
app.listen(3000, () => console.log("Server is running at http://localhost:3000"))