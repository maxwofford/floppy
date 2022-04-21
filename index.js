const filesDir = './files/'

const shell = require('shelljs')
const fs = require('fs')
const express = require('express')
const fileUpload = require("express-fileupload")
const wifiName = require('wifi-name')
const timeago = require('timeago.js')

const app = express()

async function clearDirectory(dryRun = true) {
  const action = dryRun ? 'print' : 'delete'
  await shell.exec(`find ${filesDir} -maxdepth 1 -mtime +1 -type f -iname ".*" -${action}`)
}

function fileList() {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        reject(err)
      }
  
      files.filter(f => i.indexOf('.') != 0)
      resolve(filteredFiles)
      // files object contains all files names
      // log them on console
      files.forEach(file => {
          console.log(file);
      });
    });
  })
}

app.set('view engine', 'ejs');
app.set('views','./views');


app.get("/", async function (req, res) {
  await clearDirectory(true)
  const lsFiles = shell.ls('-l', filesDir)
  const sortedFiles = [...lsFiles].sort((a, b) => b.mtimeMs-a.mtimeMs)
  const files = sortedFiles.map(f => ({
    name: f.name,
    mtimeMs: f.mtimeMs,
    timeago: timeago.format(f.mtimeMs)
  }))
  const localhost = await shell.exec('scutil --get LocalHostName').trim()
  res.render("index.ejs", {
    files,
    url: `${localhost}.local:3000`,
    wifi: await wifiName()
  })
})

app.use(fileUpload())
app.post("/upload", async function (req, res) {
  await clearDirectory(true)
  const { files } = req
  const { sampleFile } = files
  const uploadPath = `${filesDir}/${sampleFile.name}`
  const hasFiles = Object.keys(files).length > 0;
  try {
    if (!(files && hasFiles)) {
      return res.status(400).send("No files were uploaded.");
    }
    res.redirect("/")
    sampleFile.mv(uploadPath);
  } catch (error) {
    res.status(500).send(error);
  }
})

app.get("/delete/:filename", async function (req, res) {
  await clearDirectory(true)

  if (req.params.filename[0] == ".") {
    // error
    throw new Error("Cannot remove dotfile")
  }
  shell.rm(`${filesDir}${req.params.filename}`)
  console.log(`${filesDir}${req.params.filename}`)

  res.redirect('/')
})

app.use(express.static('files'))

app.listen(3000, '0.0.0.0', () => {
  console.log('server started')
  clearDirectory(true)
})
