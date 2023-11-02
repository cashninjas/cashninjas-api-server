import express from "express";
import cors from "cors";
import { ElectrumClient } from "electrum-cash";
import { appName, mintStatus, tokenId, contractAddressMint, mintDate, nrMintingUtxos, collectionSize, network, apiDomain, bcmrJSON, chaingraphUrl, hideIPFSImages, hideIPFSIcons } from "./config.js";
import { queryMintingNFTs } from './queryChainGraph.js';
import { vmNumberToBigInt, hexToBin, bigIntToVmNumber, binToHex } from '@bitauth/libauth';

// Load express web app.
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

// Initialize an electrum client and wait for the client to connect.
// We use this client for address updates.
const electrumClient = network == "mainnet" ? "fulcrum.greyh.at" : "chipnet.imaginary.cash";
const electrum = new ElectrumClient(appName, '1.5.1', electrumClient);
await electrum.connect();

// Declare global scope variables.
let nftsMinted = 0;
let commitmentCount = 0;
let mintingUtxos = [];
let mintedPerUtxo = [];

// This function is called when an address updates,
// then it calls Chaingraph to get updated UTXO information.
async function updateMintingUtxos() {
  const oldAmountMinted = mintedPerUtxo.reduce((a, b) => a + b, 0);
  const responseJson = await queryMintingNFTs(tokenId, chaingraphUrl);

  const newMintingUtxos = [];
  const newMintedPerUtxo = [];

  if (responseJson.data) {
    const outputs = responseJson.data.output;
    let txidChanged = false;
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      const txid = output.transaction_hash.slice(2);
      const commitmentScriptNum = output.nonfungible_token_commitment.slice(2);
      const newMintingUtxo = { txid, vout: output.output_index, commitment: commitmentScriptNum };
      const commitmentNumber = Number(vmNumberToBigInt(hexToBin(commitmentScriptNum)));
      const numberMintingUtxo = commitmentNumber % nrMintingUtxos;
      const oldMintingUtxo = mintingUtxos[numberMintingUtxo];
      const oldTxId = oldMintingUtxo?.txid;
      if (oldTxId != txid) { txidChanged = true; };
      newMintingUtxos[numberMintingUtxo] = newMintingUtxo;
      const amountMinted = Math.floor(commitmentNumber / nrMintingUtxos);
      newMintedPerUtxo[numberMintingUtxo] = amountMinted;
    }

    // We need to set newMintedPerUtxo to the max number of minted items for
    // any fully used minting UTXO. Otherwise the reduce below will not
    // be accurate near the end of the mint.
    for (let i = 0; i < nrMintingUtxos; i++) {
      if (newMintedPerUtxo[i] == undefined) {
        newMintedPerUtxo[i] = collectionSize / nrMintingUtxos;
      }
    }

    // Update global state.
    mintingUtxos = newMintingUtxos;
    mintedPerUtxo = newMintedPerUtxo;
    nftsMinted = mintedPerUtxo.reduce((a, b) => a + b, 0);

    const noStateUpdate = nftsMinted == oldAmountMinted && !txidChanged;
    // If the Chaingraph instance has not seen the new tx, wait and re-fetch.
    if (noStateUpdate && nftsMinted != 0) {
      setTimeout(updateMintingUtxos, 500);
    }
  } else {
    console.log(responseJson);

    // Fire off another attempt. We errored out!
    updateMintingUtxos();
  }
}

// Listen for notifications and set up a subscription with callback function.
electrum.on('notification', () => updateMintingUtxos());
await electrum.subscribe('blockchain.address.subscribe', contractAddressMint);

// Home route.
app.get('/', (req, res) => {
  let nftsAvailable = collectionSize - nftsMinted;
  res.json({
    nftsMinted,
    nftsAvailable,
    mintStatus
  });
});

// Minting UTXO information route.
app.get('/mint', (req, res) => {
  let availableMintingUtxo = "";

  if (mintingUtxos.length > 0) {
    // Remove all undefined minting UTXOs.
    let existingMintingUtxos = [];
    for (let i = 0; i < mintingUtxos.length; i++) {
      if (mintingUtxos[i] != undefined) {
        existingMintingUtxos.push(mintingUtxos[i]);
      }
    }

    // If we have UTXOs left, pick a revolving commitment.
    if (existingMintingUtxos.length > 0) {
      let idx = commitmentCount % existingMintingUtxos.length;

      availableMintingUtxo = existingMintingUtxos[idx].commitment;
      commitmentCount++;
    }
  }

  res.json({
    contractAddressMint,
    mintingUtxos,
    mintedPerUtxo,
    availableMintingUtxo
  });
});

// Filters BCMR file to hide IPFS links and unminted items.
const filteredBCMR = function (bcmr) {
  let bcmrCopy = JSON.parse(JSON.stringify(bcmr));

  if (bcmrCopy.identities[tokenId]) {
    for (let i = 0; i < collectionSize; i++) {
      let vmNum = bigIntToVmNumber(BigInt(i));
      let indexHex = binToHex(vmNum);

      if (!nftMinted(i + 1)) {
        delete bcmrCopy.identities[tokenId][mintDate]["token"]["nfts"]["parse"]["types"][indexHex];
      } else {
        if (hideIPFSImages) {
          if (bcmrCopy.identities[tokenId][mintDate]["token"]["nfts"]["parse"]["types"][indexHex]) {
            bcmrCopy.identities[tokenId][mintDate]["token"]["nfts"]["parse"]["types"][indexHex]["uris"]["image"] = apiDomain + "images/" + (i + 1);
          }
        }
        if (hideIPFSIcons) {
          if (bcmrCopy.identities[tokenId][mintDate]["token"]["nfts"]["parse"]["types"][indexHex]) {
            bcmrCopy.identities[tokenId][mintDate]["token"]["nfts"]["parse"]["types"][indexHex]["uris"]["icon"] = apiDomain + "icons/" + (i + 1);
          }
        }
      }
    }
  }

  return bcmrCopy;
};

// BCMR route.
app.get('/.well-known/bitcoin-cash-metadata-registry.json', (req, res) => {
  res.json(filteredBCMR(bcmrJSON));
});

// Checks if an NFT has been minted. Used as a gate by many endpoints.
const nftMinted = function (id) {
  // If we don't have any minted, it's all false.
  if (mintedPerUtxo == []) {
    return false;
  }

  let threadID = (id - 1) % nrMintingUtxos;

  let highMintId = mintedPerUtxo[threadID] * nrMintingUtxos;

  return id <= highMintId;
};

// Sends an image for an NFT.
const sendImage = function (id) {
  if (nftMinted(id)) {
    return 'data/images/' + id + '.png';
  } else {
    return 'images/unknown.webp';
  }
};

// NFT image route.
app.get('/images/:id', (req, res) => {
  res.sendFile(sendImage(req.params.id), { root: '.' });
});

// Sends an icon for an NFT.
const sendIcon = function (id) {
  if (nftMinted(id)) {
    return 'data/icons/' + id + '.png';
  } else {
    return 'images/unknown-icon.webp';
  }
};

// NFT icon route.
app.get('/icons/:id', (req, res) => {
  res.sendFile(sendIcon(req.params.id), { root: '.' });
});

// Filters BCMR down to a single NFT record.
const bcmrNFT = function (id, bcmr) {
  if (bcmr.identities[tokenId]) {
    if (nftMinted(id)) {
      let vmNum = bigIntToVmNumber(BigInt(id - 1));
      let indexHex = binToHex(vmNum);

      if (hideIPFSImages) {
        if (bcmr.identities[tokenId][mintDate]["token"]["nfts"]["parse"]["types"][indexHex]) {
          bcmr.identities[tokenId][mintDate]["token"]["nfts"]["parse"]["types"][indexHex]["uris"]["image"] = apiDomain + "images/" + (id);
        }
      }
      if (hideIPFSIcons) {
        if (bcmr.identities[tokenId][mintDate]["token"]["nfts"]["parse"]["types"][indexHex]) {
          bcmr.identities[tokenId][mintDate]["token"]["nfts"]["parse"]["types"][indexHex]["uris"]["icon"] = apiDomain + "icons/" + (id);
        }
      }

      return bcmr.identities[tokenId][mintDate]["token"]["nfts"]["parse"]["types"][indexHex];
    }
  }

  return {};
};

// NFT metadata route.
app.get('/nfts/:id', (req, res) => {
  res.json(bcmrNFT(req.params.id, bcmrJSON));
});

// Start server.
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
