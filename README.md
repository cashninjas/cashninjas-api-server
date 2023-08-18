# CashNinjas API Server

## Commands

### Installation

```
npm install
```

### Configure

Update `config.js` with your collection specific information.

### Run Server

```
npm start
```

### Setup Data Directory (Optional)

```
# Make git/docker ignored data directory.
mkdir data

# Copy BCMR file
cp <path-to-BCMR-file> data/bitcoin-cash-metadata-registry.json

# Copy collection images
cp <path-to-collection-images> data/images

# Copy collection icons
cp <path-to-collection-icons> data/icons
```

### Endpoints

`/` - Mint summary.

`/mint` - Minting UTXO data.

`/icons/:id` - Show icon for NFT.

`/images/:id` - Show image for NFT.

`/nfts/:id` - Show metadata for NFT.

`/.well-known/bitcoin-cash-metadata-registry.json` - BCMR registry.

### Build Docker Image

```
docker build -t cashninja-server .
```

### Run Docker Image

```
docker run -p 8777:3000 cashninja-server
```

Then visit [http://127.0.0.1:8777](http://127.0.0.1:8777).

Profit.
