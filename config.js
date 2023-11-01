import fs from "fs";

// Configure the following block for your mint.
const mintStatus = "inactive";
const tokenId = "";
const contractAddressMint = "";
const mintDate = "2023-09-15T06:25:36.020Z";
const nrMintingUtxos = 5;
const collectionSize = 5000;
const network = "mainnet";
const apiDomain = "https://example.com/";
const appName = "YourAppName";

// Chaingraph instance. This returns our UTXO information.
// Thanks Jason for running an awesome server.
const chaingraphUrl = "https://demo.chaingraph.cash/v1/graphql";

// Hide ipfs urls. Don't want to leak during mint.
const hideIPFSImages = true;
const hideIPFSIcons = true;

// Look for BCMR JSON file on data mount, if not found, then set a stub.
var bcmrJSON = {};
try {
  bcmrJSON = JSON.parse(fs.readFileSync('data/bitcoin-cash-metadata-registry.json',
    { encoding: 'utf8', flag: 'r' }));
} catch (error) {
  bcmrJSON = {
    "$schema": "https://cashtokens.org/bcmr-v2.schema.json",
    "version": {
      "major": 1,
      "minor": 0,
      "patch": 0
    },
    "latestRevision": "2023-09-15T06:25:36.020Z",
    "registryIdentity": {
      "name": "CashNinjas Registry",
      "description": "Registry for the CashNinjas collection.",
      "uris": {
        "icon": "https://ninjas.cash/images/registry.png",
        "web": "https://ninjas.cash/",
        "registry": apiDomain + ".well-known/bitcoin-cash-metadata-registry.json"
      }
    },
    "identities": {
    },
    "license": "CC0-1.0"
  };
}

export { appName, mintStatus, tokenId, contractAddressMint, mintDate, nrMintingUtxos, collectionSize, network, apiDomain, bcmrJSON, chaingraphUrl, hideIPFSImages, hideIPFSIcons };