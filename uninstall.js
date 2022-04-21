const shell = require("shelljs")

console.log('Checking for sudo access...')
const SUDO = shell.exec('sudo -n true').code
if (SUDO != 0) {
    console.log('Could not get sudo access, please rerun with sudo or install plist manually')
    process.exit(1)
}

// const USER_ID = shell.exec('id -u').stdout.trim()
const SERVICE_NAME = 'com.hackclub.floppy'
const LAUNCHD_PLIST_PATH = `/Library/LaunchDaemons/${SERVICE_NAME}.plist`

console.log('Stopping...')
shell.exec(`sudo launchctl stop ${SERVICE_NAME}`)
// console.log('Disabling...')
// shell.exec(`launchctl disable gui/${USER_ID}/${SERVICE_NAME}`)
console.log('Unloading...')
shell.exec(`sudo launchctl unload -w ${LAUNCHD_PLIST_PATH}`)
console.log('Removing file...')
shell.exec(`mv ${LAUNCHD_PLIST_PATH} /tmp/${SERVICE_NAME}.plist`)
console.log(`File recycled to /tmp/${SERVICE_NAME}.plist`)

console.log('Removing launcher...')
const EXEC_PATH = shell.exec('pwd').stdout.trim()
const EXECUTABLE = `${EXEC_PATH}/launcher.sh`
shell.exec(`mv ${EXECUTABLE} /tmp/${SERVICE_NAME}-launcher.sh`)
console.log(`File recycled to /tmp/${SERVICE_NAME}-launcher.sh`)
