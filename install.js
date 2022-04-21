const shell = require("shelljs")
const path = require('path')
const { ShellString } = require("shelljs")

console.log('Checking for sudo access...')
const SUDO = shell.exec('sudo -n true').code
if (SUDO != 0) {
    console.log('Could not get sudo access, please rerun with sudo or install plist manually')
    process.exit(1)
}

const USER = shell.exec('echo $SUDO_USER').trim()
console.log("Installing for", USER)

const EXEC_PATH = shell.exec('pwd').stdout.trim()
const EXECUTABLE = `${EXEC_PATH}/launcher.sh`

console.log('Creating launcher...')
const NODE_PATH = path.dirname(shell.exec('which node').trim())
const LAUNCHER_CONTENT = `
  echo "Attempting to boot server..."
  export PATH="${NODE_PATH}:$PATH"
  node ./index.js
`
ShellString(LAUNCHER_CONTENT).to(EXECUTABLE)
shell.exec(`chmod +x ${EXECUTABLE}`)

const SERVICE_NAME = 'com.hackclub.floppy'
const LAUNCHD_PLIST_PATH = `/Library/LaunchDaemons/${SERVICE_NAME}.plist`

const PLIST_CONTENT = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${SERVICE_NAME}</string>
    <key>EnvironmentalVariables</key>
    <dict>
      <key>PATH</key>
      <string>${NODE_PATH}:/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin</string>
    </dict>
    <key>UserName</key>
    <string>${USER}</string>
    <key>WorkingDirectory</key>
    <string>${EXEC_PATH}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/sh</string>
        <string>-c</string>
        <string>${EXECUTABLE}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/com.hackclub.floppy.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/com.hackclub.floppy.log</string>
  </dict>
</plist>
`

console.log('Creating', path.dirname(LAUNCHD_PLIST_PATH), '...')
shell.mkdir('-p', path.dirname(path.dirname(LAUNCHD_PLIST_PATH)))

console.log('Creating', LAUNCHD_PLIST_PATH, '...')
shell.touch(LAUNCHD_PLIST_PATH)

console.log('Writing to', LAUNCHD_PLIST_PATH, '...')
ShellString(PLIST_CONTENT).to(LAUNCHD_PLIST_PATH)

console.log('Loading into launchctl ...')
shell.exec(`sudo launchctl unload -w ${LAUNCHD_PLIST_PATH} 2>/dev/null`)
shell.exec(`sudo launchctl load -w ${LAUNCHD_PLIST_PATH}`)

console.log('Starting launchctl ...')
shell.exec(`sudo launchctl start system/${SERVICE_NAME}`)