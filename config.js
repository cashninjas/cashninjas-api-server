import fs from "fs";

// Configure the following block for your mint.
const mintStatus = "active";
const tokenId = "77a95410a07c2392c340384aef323aea902ebfa698a35815c4ef100062c6d8ac";
const contractAddressMint = "bitcoincash:pvl88yaeyajf6cn8fhaf3qasl238rzrnpmnmgzr05krpkt0ez52z5rgwl9x9u";
const mintDate = "2023-10-07T14:29:05.694Z";
const nrMintingUtxos = 25;
const collectionSize = 5000;
const network = "mainnet";
const apiDomain = "https://api.ninjas.cash/";
const appName = "Cash-Ninjas-API"

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