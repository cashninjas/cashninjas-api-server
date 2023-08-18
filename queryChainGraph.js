async function queryChainGraph(queryReq, chaingraphUrl){
    const jsonObj = {
        "operationName": null,
        "variables": {},
        "query": queryReq
    };
    const response = await fetch(chaingraphUrl, {
        method: "POST",
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json",
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(jsonObj), // body data type must match "Content-Type" header
    });
    return await response.json();
}

export async function queryMintingNFTs(tokenId, chaingraphUrl){
    const queryReqActiveMinting = `query {
        output(
          where: {
            token_category: { _eq: "\\\\x${tokenId}" }
            _and: { nonfungible_token_capability: { _eq: "minting" } }
            _not: { spent_by: {} }
          }
        ) {
          transaction_hash
          nonfungible_token_commitment
          output_index
        }
      }`;
    return await queryChainGraph(queryReqActiveMinting, chaingraphUrl);
}
