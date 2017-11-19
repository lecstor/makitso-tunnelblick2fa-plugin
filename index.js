const shell = require("shelljs");

// https://tunnelblick.net/cAppleScriptSupport.html
// https://groups.google.com/forum/#!topic/tunnelblick-discuss/1MDrN6__mdA
// osascript -e "tell application \"/Applications/Tunnelblick.app\"" -e "connect \"prod\"" -e "end tell"
// https://darthnull.org/building/2014/05/30/google-auth-tunnelblick/

async function tellTb(command) {
  return new Promise(resolve => {
    shell.exec(
      `osascript -e "tell application \\"/Applications/Tunnelblick.app\\"" \\
      -e "${command}" \\
      -e "end tell"`,
      { silent: true },
      (code, stdout, stderr) => {
        resolve({ code, stdout, stderr });
      }
    );
  });
}

/**
 * Update password in the keychain for Tunnelblick and tell Tunnelblick to connect the VPN
 *
 * @param {Object} context - an instance of Makitso Context
 * @param {String} connectionName - the connection name as is in Tunnelblick
 * @param {String} token - 2fa token from your device
 * @returns {void}
 */
async function connectVpn(context, { configuration, token }) {
  const password = await context.get(`tunnnelblick.password.${configuration}`);
  await context.set(
    `tunnnelblick.passToken.${configuration}`,
    `${password}${token}`
  );
  return tellTb(`connect "${configuration}"`);
}

/**
 * Tell Tunnelblick to disconnect the VPN
 *
 * @param {Object} context - an instance of Makitso Context
 * @param {String} connectionName - the connection name as is in Tunnelblick
 * @returns {void}
 */
async function disconnectVpn(context, { configuration }) {
  return tellTb(`disconnect "${configuration}"`);
}

async function getConfigNames() {
  return tellTb("get name of configurations").then(
    ({ code, stdout, stderr }) => {
      if (code) {
        throw new Error(stderr);
      }
      let confs = stdout.replace(/\n$/, "").split(/,\s*/);
      return confs;
    }
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
  connect: {
    args: "configuration token",
    description: "Connect to VPN with Tunnelblick",
    choices: {
      configuration: getConfigNames
    },
    action: connectVpn
  },
  disconnect: {
    args: "configuration",
    description: "Disconnect from VPN with Tunnelblick",
    action: disconnectVpn,
    choices: {
      configuration: getConfigNames
    }
  },
  show: {
    configurations: {
      description: "Show configured Tunnelblick VPN connections",
      action: context => getConfigNames(context).then(console.log)
    }
  }
};

const config = {
  command: "vpn"
};

/**
 * get the plugin configuration
 * @returns {Object} config - plugin config
 */
function plugin() {
  return { schema, commands, config };
}

module.exports.plugin = plugin;
