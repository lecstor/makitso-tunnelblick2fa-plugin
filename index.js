const shell = require("shelljs");

// https://tunnelblick.net/cAppleScriptSupport.html
// https://groups.google.com/forum/#!topic/tunnelblick-discuss/1MDrN6__mdA
// osascript -e "tell application \"/Applications/Tunnelblick.app\"" -e "connect \"prod\"" -e "end tell"
// https://darthnull.org/building/2014/05/30/google-auth-tunnelblick/

/**
 * Update password in the keychain for Tunnelblick and tell Tunnelblick to connect the VPN
 *
 * @param {Object} context - an instance of Makitso Context
 * @param {String} connectionName - the connection name as is in Tunnelblick
 * @param {String} token - 2fa token from your device
 * @returns {void}
 */
async function connectVpn(context, connectionName, token) {
  const password = await context.get(`tunnnelblick.password.${connectionName}`);
  await context.set(
    `tunnnelblick.passToken.${connectionName}`,
    `${password}${token}`
  );
  shell.exec(
    `osascript -e "tell application \\"/Applications/Tunnelblick.app\\"" \\
      -e "connect \\"${connectionName}\\"" \\
      -e "end tell"`
  );
}

/**
 * Tell Tunnelblick to disconnect the VPN
 *
 * @param {Object} context - an instance of Makitso Context
 * @param {String} connectionName - the connection name as is in Tunnelblick
 * @returns {void}
 */
async function disconnectVpn(context, connectionName) {
  shell.exec(
    `osascript -e "tell application \\"/Applications/Tunnelblick.app\\"" \\
      -e "disconnect \\"${connectionName}\\"" \\
      -e "end tell"`
  );
}

const schema = {
  tunnnelblick: {
    password: {
      store: "secure",
      storeOptions: {
        service: "commandit-tunnelblick-{variant}",
        account: "password"
      },
      prompt: {
        type: "password",
        name: "password",
        message: `Enter your VPN password ...`
      }
    },
    passToken: {
      store: "secure",
      storeOptions: {
        service: "Tunnelblick-Auth-{variant}",
        account: "password"
      }
    }
  }
};

const commands = {
  connectVpn: {
    command: "vpn <name> <token>",
    description: "Connect to VPN with Tunnelblick",
    action: connectVpn
  },
  disconnectVpn: {
    command: "vpnq <name>",
    description: "Disconnect from VPN with Tunnelblick",
    action: disconnectVpn
  }
};

/**
 * get the plugin configuration
 * @returns {Object} config - plugin config
 */
function plugin() {
  return { schema, commands };
}

module.exports.plugin = plugin;
